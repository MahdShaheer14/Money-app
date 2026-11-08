# Budge — servers folder

**You do not need any server. Budge is SMS-only and runs entirely on your phone.**

The Android app (`Budge.apk`) reads bank SMS directly using a `BroadcastReceiver`
for `android.provider.Telephony.SMS_RECEIVED`. Nothing leaves the device, and the
app deliberately declares **no `INTERNET` permission** — it *cannot* upload
anything even if it wanted to.

```
Bank SMS ──▶ SmsReceiver (Android) ──▶ SmsParser ──▶ Room DB ──▶ UI + notification
```

> **Gmail integration has been removed.** Earlier versions of Budge could read
> transaction emails through a Google OAuth relay. That path is gone: the model
> now assumes every transaction arrives as an SMS, because in practice that is
> how cash and transfer notifications reach you.

---

## `sms_server.py` (optional, legacy)

Kept only for the browser build (`index.html`) and for testing the parser from a
desktop. It is a plain standard-library relay with no third-party dependencies:

```
Bank SMS ──HTTP POST──▶ sms_server.py :5179 ──▶ index.html polls it
```

```bash
python3 server/sms_server.py          # then open index.html
```

It stores messages in memory for the polling window and writes nothing to disk.

**On a real phone, ignore it.** Install `Budge.apk`, grant the SMS permission,
and the native app does the same job with no relay, no PC and no pasting.

---
