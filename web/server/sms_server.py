#!/usr/bin/env python3
"""
Budge — SMS relay
=================

A tiny local bridge that collects bank SMS from your phone so Budge can read
them automatically. Standard library only — no pip install, no cloud account.

WHY THIS EXISTS
---------------
A web page cannot read your SMS. Android and iOS only grant SMS access to a
messaging app that the user has set as default — that is an operating-system
rule, not something a website can work around, and there is no web API for it.

So the message has to arrive from outside the browser. This server gives you a
private inbox on your own machine; your phone forwards messages into it, and
Budge polls it.

TWO WAYS TO GET MESSAGES IN
---------------------------
1. SMS Forwarder app (fully automatic, recommended)
   Install any "SMS to HTTP / SMS Forwarder" app on Android, create a rule:
       From:  ASKARI, HBL, 8556, 3737, NayaPay, SadaPay   (any sender you like)
       URL:   http://<your-pc-ip>:5179/sms
       Method: POST      Body: {"from":"%from%","text":"%text%","date":"%date%"}

2. Shortcuts / Tasker / MacroDroid
   Any automation tool that can POST JSON will do. Same endpoint.

Then in Budge → Autopilot → "Bank messages", set the relay address and press
Connect. Budge polls /inbox every few seconds while it is open.

Run:
    python3 server/sms_server.py

Find your PC's LAN IP with `ip addr` (Linux) or `ipconfig` (Windows), and use
that address in the forwarding app so your phone can reach it.

Security notes:
  * Binds to 0.0.0.0 so your phone on the same Wi-Fi can reach it.
  * An optional shared token (BUDGE_SMS_TOKEN) is required on every request.
  * Messages are kept in memory only, and deleted once Budge collects them.
  * Nothing is ever sent to the internet.
"""

import json
import os
import threading
import urllib.parse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("BUDGE_SMS_PORT", "5179"))
TOKEN = os.environ.get("BUDGE_SMS_TOKEN", "").strip()
MAX_KEEP = 400          # hard cap on stored messages
MAX_BODY = 64 * 1024    # reject anything bigger than 64 KB

_lock = threading.Lock()
_messages = []          # [{id, from, text, date, received}]
_counter = {"n": 0}


def _now():
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="minutes")


def add_message(sender, text, date):
    """Store one incoming message. Returns the stored record."""
    with _lock:
        _counter["n"] += 1
        rec = {
            "id": "sms-%d-%d" % (int(datetime.now().timestamp() * 1000), _counter["n"]),
            "from": (sender or "unknown")[:64],
            "text": (text or "")[:4000],
            "date": date or _now(),
            "received": _now(),
        }
        _messages.append(rec)
        if len(_messages) > MAX_KEEP:
            del _messages[:-MAX_KEEP]
        return rec


def take_messages(since_id=None):
    """Return new messages and forget them — Budge keeps its own copy."""
    with _lock:
        if since_id:
            seen = {m["id"] for m in _messages}
            if since_id in seen:
                idx = [m["id"] for m in _messages].index(since_id) + 1
                out = _messages[idx:]
            else:
                out = list(_messages)
        else:
            out = list(_messages)
        for m in out:
            try:
                _messages.remove(m)
            except ValueError:
                pass
        return out


def stats():
    with _lock:
        return {"queued": len(_messages), "tokenRequired": bool(TOKEN)}


class Handler(BaseHTTPRequestHandler):
    server_version = "BudgeSMS/1.0"

    # ---------- helpers ----------
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Budge-Token")

    def _json(self, payload, code=200):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _html(self, page, code=200):
        body = page.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _authorised(self):
        if not TOKEN:
            return True
        sent = self.headers.get("X-Budge-Token") or ""
        if sent == TOKEN:
            return True
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        return (qs.get("token") or [""])[0] == TOKEN

    def log_message(self, fmt, *args):
        import sys
        sys.stderr.write("  %s\n" % (fmt % args))

    # ---------- routes ----------
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path.rstrip("/") or "/"

        if path not in ("/sms", "/inbox", "/webhook"):
            self._json({"error": "not found"}, 404)
            return

        if not self._authorised():
            self._json({"error": "bad or missing token"}, 401)
            return

        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length > MAX_BODY:
            self._json({"error": "body too large"}, 413)
            return

        raw = self.rfile.read(length) if length else b""
        ctype = (self.headers.get("Content-Type") or "").lower()

        sender, text, date = "", "", ""

        if "application/json" in ctype:
            try:
                data = json.loads(raw.decode("utf-8", "replace") or "{}")
            except ValueError:
                self._json({"error": "invalid JSON"}, 400)
                return
            sender = data.get("from") or data.get("sender") or data.get("address") or ""
            text = data.get("text") or data.get("message") or data.get("body") or ""
            date = data.get("date") or data.get("time") or ""
        else:
            # form-encoded (many Android forwarders send this by default)
            form = urllib.parse.parse_qs(raw.decode("utf-8", "replace"))
            def pick(*keys):
                for k in keys:
                    if form.get(k):
                        return form[k][0]
                return ""
            sender = pick("from", "sender", "address", "phone")
            text = pick("text", "message", "body", "msg")
            date = pick("date", "time", "received")

        if not text.strip():
            self._json({"error": "no message text"}, 400)
            return

        rec = add_message(sender, text, date)
        print("  + %s  %s" % (rec["from"], rec["text"][:70].replace("\n", " ")))
        self._json({"ok": True, "id": rec["id"], "queued": stats()["queued"]}, 201)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = urllib.parse.parse_qs(parsed.query)

        if path == "/":
            s = stats()
            self._html(PAGE_STATUS.format(
                queued=s["queued"],
                port=PORT,
                token="on" if TOKEN else "off",
            ))
            return

        if path == "/health":
            self._json({"ok": True, "service": "budge-sms", **stats()})
            return

        if path == "/inbox":
            if not self._authorised():
                self._json({"error": "bad or missing token"}, 401)
                return
            since = (qs.get("since") or [None])[0]
            msgs = take_messages(since)
            self._json({"count": len(msgs), "messages": msgs})
            return

        self._json({"error": "not found"}, 404)


PAGE_STATUS = """<!doctype html>
<html><head><meta charset="utf-8"><title>Budge SMS relay</title>
<style>
 body{{background:#0A0B0E;color:#EDEFE6;font:15px/1.6 system-ui,sans-serif;
      margin:0;padding:44px 22px;display:flex;justify-content:center}}
 .card{{max-width:520px;width:100%}}
 h1{{font-size:23px;margin:0 0 4px;letter-spacing:-.02em}}
 .sub{{color:#8A8F9C;font-size:13px;margin-bottom:22px}}
 .row{{display:flex;justify-content:space-between;padding:11px 0;
      border-bottom:1px solid #1E2029;font-size:13px}}
 .row span{{color:#8A8F9C}} .row b{{color:#D7FA4C}}
 code{{background:#131419;padding:2px 6px;border-radius:5px;font-size:12px;color:#7EE7B9}}
 pre{{background:#131419;border:1px solid #1E2029;border-radius:11px;
      padding:13px;overflow:auto;font-size:11.5px;line-height:1.6;color:#B9BFCB}}
 .ok{{display:inline-block;background:rgba(215,250,76,.12);color:#D7FA4C;
      padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.05em}}
</style></head><body><div class="card">
<h1>Budge SMS relay</h1>
<div class="sub">Listening for forwarded bank messages on port {port}</div>
<div class="row"><span>Status</span><b class="ok">RUNNING</b></div>
<div class="row"><span>Queued for Budge</span><b>{queued}</b></div>
<div class="row"><span>Shared token</span><b>{token}</b></div>

<h3 style="font-size:14px;margin:26px 0 8px">Point your forwarding app here</h3>
<pre>POST  http://&lt;this-pc-ip&gt;:{port}/sms
Content-Type: application/json

{{"from":"%from%","text":"%text%","date":"%date%"}}</pre>

<h3 style="font-size:14px;margin:22px 0 8px">Then in Budge</h3>
<p style="font-size:13px;color:#8A8F9C;margin:0">
Autopilot → Bank messages → Connect, using
<code>http://&lt;this-pc-ip&gt;:{port}</code>
</p>
</div></body></html>
"""


def main():
    print("Budge SMS relay")
    print("  listening on  http://0.0.0.0:%d" % PORT)
    print("  POST messages to /sms   ·   Budge polls /inbox")
    print("  token: %s" % ("required" if TOKEN else "not set (local network only)"))
    print("  Ctrl-C to stop\n")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        server.server_close()


if __name__ == "__main__":
    main()
