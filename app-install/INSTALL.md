> **Historical document:** This describes the APK and signing key in the original ZIP, not the current GitHub Actions build. See the root README for current build and installation instructions. Some screen names below may be outdated.

# Budge — install it on your phone

`Budge.apk` is a real Android app. Install it once, allow SMS access, and every
bank message after that is read and logged on the phone itself. No computer, no
relay, no pasting.

**File:** `Budge.apk` — 1.5 MB, signed (v2.0), works on Android 6.0 and newer.

---

## 1 · Copy it to your phone

Any of these work:

- Plug the phone into a computer with a USB cable → copy `Budge.apk` to the
  phone's Download folder
- Email it to yourself and download the attachment on the phone
- Upload it to Google Drive → open it on the phone → download
- Send it to yourself on WhatsApp and tap it there

## 2 · Allow installing from that app

Android blocks apps from outside the Play Store until you say otherwise.

1. Tap `Budge.apk` on the phone
2. It will say **"For your security, your phone is not allowed to install
   unknown apps from this source"** — tap **Settings**
3. Turn on **Allow from this source**
4. Press back, tap **Install**

You may also see **Play Protect** warn about an unknown developer — tap
**Install anyway** / **More details → Install anyway**. That warning appears for
every app not distributed by Google; it does not mean something is wrong.

## 3 · Open Budge and allow SMS

1. Open **Budge** from your app drawer
2. The app opens on the **SMS Inbox** screen
3. Under **Bank messages**, tap **Allow SMS access**
4. Android asks *"Allow Budge to receive and read your SMS?"* → **Allow**

That is the only permission that matters. Budge reads bank alerts and nothing
else — it never sends SMS, never uploads message text anywhere, and all the
parsed data stays in the app's own storage on your phone.

## 4 · Set your rules once

Open **Autopilot → Message rules**. Six sender rules are already there:

| From | Goes to |
|---|---|
| `ASKARI` | Askari Bank |
| `HBL` | HBL Bank |
| `8556` | JazzCash |
| `3737` | Easypaisa |
| `NayaPay` | NayaPay |
| `SadaPay` | SadaPay |

Tap any row to change the number or point it at a different account. Add more
with **New rule** — for example your own bank's shortcode.

Then add **merchant rules** for the things you buy often. The example you gave:

> amount `421` → merchant **Amazon Prime Video** → category **Entertainment**

Add it once and every future Rs 421 debit — from any bank — is filed correctly
and named for you.

## 5 · That's it

From now on, when a bank SMS arrives:

```
Bank SMS ──▶ Android ──▶ Budge (SmsReceiver)
                              │ reads amount, sender, merchant
                              │ applies YOUR rules
                              ▼
                    logged automatically
                    + notification: "Bank message from HBL"
```

Open the app any time and the transactions are already there, in the right
account, under the right category. A notification appears the moment a money
message arrives.

Your rules live in **Autopilot → Message rules** — nothing is hard-coded, and
you can change any of it without rebuilding the app.

---

## Turning on Gmail as well

Autopilot → **Connect Gmail** still works inside the app for email receipts.
It uses Google's OAuth flow, read-only, and needs a one-time client ID (see
`budge-app/server/README.md`). SMS needs none of that setup — it works the
moment you grant the permission.

---

## Honest notes

**Sideloading is the right way to install this.** Google Play restricts the
`READ_SMS` permission to apps that are the phone's default SMS handler, or that
qualify for a narrow financial-transaction exception that Google approves case
by case. A personal budgeting app almost certainly would not be approved. So
`Budge.apk` is built to be installed directly, which needs no approval.

**What the permission actually grants.** `READ_SMS` + `RECEIVE_SMS` let Budge
read every SMS on the device, not only bank ones. The code only acts on
transaction-shaped messages and stores only what it parses, but you should know
the scope of what you are granting. Revoke it any time in
Settings → Apps → Budge → Permissions.

**Parsing is heuristic, not magic.** Bank wording changes. If a bank rephrases
its alerts, add a rule (or a keyword) matching the new wording — the app tells
you the confidence on every message, and anything it is not sure about waits for
you rather than posting a wrong number.

**iOS.** Not possible. Apple does not allow any app to read SMS, and offers no
API for it. This is Android only.

---

## Rebuilding after a change

```bash
cd budge-app  && python3 build.py          # rebuild the web app
cd ../budge-android && python3 build_apk.py # rebuild the APK
```

`build_apk.py` uses the Android SDK directly (javac → d8 → aapt2 → apksigner).
It needs JDK 17 and `ANDROID_HOME` with `platforms;android-34` and
`build-tools;34.0.0`.

**Keep `budge-release.jks`.** It is the signing key. Android will refuse to
*update* an installed Budge with an APK signed by a different key — so keep this
file with the project.

## Files

```
Budge.apk                          ← install this
build_apk.py                       ← builds the APK
budge-release.jks                  ← signing key (keep it)
app/src/main/AndroidManifest.xml   ← permissions, receiver, activity
app/src/main/java/com/budge/app/
    MainActivity.java              ← WebView shell + permission + notifications
    SmsReceiver.java               ← catches SMS the moment they arrive
app/src/main/assets/index.html     ← the whole Budge app (from budge-app/)
app/src/main/res/                  ← icon, theme, strings
```
