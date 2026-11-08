# Prompt: SMS/Email → automatic transactions with user rules

Copy everything below the line into an AI coding assistant. It is written to be
self-contained — it describes the app, the exact behaviour you want, and the
platform limits so the AI doesn't promise something a browser can't do.

---

## THE PROMPT

I have a personal finance web app (a single-file HTML/JS app called Budge, dark
neon-lime UI, 6 tabs: Home, Budget, Monthly, People, Wallet, Autopilot). It
already has an Autopilot tab that reads transaction emails and turns them into
transactions. I want to extend it so it reads **bank SMS as well as email**, and
so that **I can teach it my own rules** instead of relying on guessing.

Please implement all of the following in the existing codebase. Read the current
files first (`index.html`, or `src.html` + `app-core.js` + `app-render.js` +
`app-ui.js` + `build.py`) and match the existing code style, CSS tokens and
component patterns. Do not rewrite the app — extend it.

### 1. A rule engine that decides what a message is

Every incoming message (SMS or email) must pass through a rules engine before it
becomes a transaction. Two kinds of rule:

**Sender rules — "messages from this number are this institution."**
- Each rule: `{ institution, match (number or name substring), accountId, enabled }`
- Example: `8556 → JazzCash`, `ASKARI → Askari Bank`, `HBL → HBL Bank`,
  `3737 → Easypaisa`, `NayaPay → NayaPay`, `SadaPay → SadaPay`
- The matched institution decides **which account the transaction posts to**.
- A `from` match must beat a match found only in the message body.

**Merchant rules — "this transaction is this merchant."**
- Each rule: `{ merchant, amount (optional), keyword (optional), categoryId,
  sourceKey (optional), accountId (optional), enabled }`
- Example: *"any debit of exactly Rs 421 is Amazon Prime Video, category
  Entertainment"*.
- If `amount` is set, the rule only matches that amount (±0.50). If `keyword` is
  set, that word must appear. If both are blank, it matches anything.
- A merchant rule's rename + category must override whatever generic parsing
  produced.

**Precedence (important):** explicit user merchant rule > built-in brand
catalogue > "at MERCHANT" text extraction > fallback. User rules always win.

### 2. Parse real Pakistani bank / wallet SMS

The message formats look like this — handle all of them:

```
Askari Bank: PKR 421.00 debited from A/C **4417 on 08-11-25 at AMAZON PRIME VIDEO. Avail Bal: PKR 285,879.00
HBL: Your A/C 9082 has been debited with PKR 1,850.00 on 07-11-25 at FOODPANDA.
JazzCash: Rs 3,000.00 debited from your account. Txn: Restaurant payment.
Easypaisa: Rs 500 sent to ABDUL REHMAN. Your new balance is Rs 8,700.00.
NayaPay: Rs 2,340.00 debited at DARAZ. Card ending 5521.
SadaPay: You spent Rs 685.00 at CAREEM. Available balance: Rs 12,065.00
Askari Bank: PKR 95,000.00 credited to A/C **4417. Salary credit.
JazzCash: Rs 3,000.00 received from SANA MALIK. Txn ID 8811234.
```

Requirements:
- **Amount**: handle `Rs`, `PKR`, `Rs.`, thousands separators and decimals.
- **Direction**: `debited / withdrawn / spent / paid / sent / purchase` = money
  out. `credited / received / deposit / refund` = money in. Be careful — a
  message can contain both words; the primary verb wins.
- **Merchant**: bank SMS put the merchant after `at` in ALL CAPS and then a full
  stop. Trim bank boilerplate that follows (`Avail Bal`, `Txn`, `Ref`, `on`, …).
  Handle `received from NAME` / `sent to NAME` as person transfers.
- **Noise**: OTP / verification code messages, statements and promos must be
  rejected — never create a transaction from them.
- **Confidence score** 0–1. Award it for: amount found, sender rule matched,
  merchant rule matched, clear debit/credit verb. Penalise noise heavily.
  Below ~0.55 reject entirely; between 0.55 and ~0.72 queue for review; above
  that auto-post.

### 3. Get SMS into the app — and be honest about the platform limit

**A web page cannot read SMS.** Android and iOS only grant SMS access to an app
set as the default messaging client. There is no browser API for it. Do not
pretend otherwise or write code that tries.

Implement two routes instead:

**(a) A local relay server** — a small standard-library-only Python HTTP server
(`server/sms_server.py`) that:
- `POST /sms` accepts `{"from", "text", "date"}` as JSON **or** form-encoded
  (`from=`, `text=`, `date=`), because Android SMS-forwarder apps send both.
- `GET /inbox` returns queued messages as `{count, messages:[...]}` and then
  deletes them (so nothing is counted twice).
- `GET /health` and `GET /` (a small HTML status page explaining setup).
- Binds `0.0.0.0` on port 5179, supports an optional shared token via
  `X-Budge-Token` header or `?token=`, caps body size, keeps messages in memory
  only, CORS `*`.
- The app polls it every ~15s while open, with a manual "Check now" button.

**(b) Manual paste** — a sheet where the user pastes message text + sender, which
then goes through the exact same rules engine and shows a confirmation sheet
("Here's what I read" with amount, merchant, account, category, and editable
fields) before posting.

### 4. The confirmation + teach flow

After parsing, show a sheet that states plainly what was understood:
- institution + confidence, the signed amount, merchant name
- which account, which category, which date
- the fields must be editable (merchant, account, category)
- one button "Add Rs X to spending / income"
- one button **"Always treat this sender this way"** which opens the rule editor
  pre-filled from the message

Also add "Always treat this as <merchant>" on any existing transaction, so a user
can look at a wrongly-categorised past transaction and teach the rule from it.

### 5. A rules manager screen

A sheet listing, in two groups:
- **Sender → account** (institution, the match string, the target account)
- **Merchant rules** (merchant, amount/keyword, category)

Each row opens an editor (create / edit / enable-disable / delete). The list must
show how many rules exist on the Autopilot screen with a link into it.

### 6. Accounts

Seed one account for each institution: Askari Bank, HBL Bank, JazzCash,
Easypaisa, NayaPay, SadaPay, plus a Cash wallet. Allow adding new institutions
later. A message routed to JazzCash must never touch the Askari balance.

### 7. Seed rules and demo data

- Seed the six sender rules above on first run.
- Add a "Try sample SMS" button that feeds 10 realistic messages through the
  engine so the behaviour is visible immediately, and confirm ~9 parse and the
  OTP is rejected.
- Include the Rs 421 / Amazon Prime Video case in the samples, arriving from two
  different banks, to prove the same rule catches both.

### 8. Quality bar

- No regressions: the existing tabs, budgets, people/splits, reminders and SMS
  autopilot must keep working.
- Match the existing visual language — dark surfaces, lime accent, mint for
  income, coral for spending. Use the existing sheet/field/button components.
- Everything persists to `localStorage`, with migration so existing users don't
  lose data when new state keys appear.
- Test in a real browser with Playwright: rule routing per institution, the 421
  rule firing from two banks, a full relay round-trip (POST an SMS → poll →
  transaction appears in the right account with the right balance change), no
  duplicate on a second poll, and no horizontal overflow at 375px.
- Report honestly what you could not do. Do not claim an app can read SMS
  directly from the browser.

### 9. What to tell me when you're done

- Which files changed and what each change does
- The exact forwarding-app configuration (URL, method, body template) I need to
  set on my phone
- How to run the relay
- Any case where the parsing is heuristic rather than certain

---

## Notes for whoever uses this prompt

- Replace `Rs` / `PKR` and the bank list if you're not in Pakistan.
- The rule engine is deliberately generic: institution, amount, keyword, category.
  If you later want date-based rules ("salary only on the 1st") they slot into the
  same `rules` array.
- If you eventually want **zero** setup, the honest path is a native Android app
  with `READ_SMS`, which Google restricts to default-SMS and a narrow set of
  approved use cases. A relay is the pragmatic web answer.
