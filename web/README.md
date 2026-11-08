# Budge — money management app

A pocket-sized personal finance app with a dark, lime-accented fintech UI in the spirit
of modern "budge"-style budgeting apps. Fully working, no dependencies, single file.

## Run it

Open **`index.html`** in any browser. That's it — no build step, no server, no install.

Rename it to `index.html` on any static host (GitHub Pages, Netlify, Vercel) and it works
as a real web app. It's also installable as-is on a phone home screen.

## Screens

| Screen | What's in it |
|---|---|
| **Home** | Total balance, **"after all settlements" figure** with owed/owing chips, income/spent cards with mini charts, savings-goal carousel, **monthly commitments block**, recent activity grouped by day |
| **Budget** | Animated remaining-budget ring, spent/safe-to-spend-per-day, all 9 category budgets with progress and over-limit warnings, month switcher |
| **Monthly** | **Subscriptions, bills and repeating monthly items** — commitment total, next 30 days, per-bucket breakdown, pause/resume, log payment |
| **People** | **Lending, borrowing, bill splitting and groups** — who owes you, who you owe, settle up, split a bill between friends |
| **Wallet** | Account cards, income/expense/saved summary, savings goals, settings and data tools |
| **Auto** | **Autopilot** — SMS + email ingestion, **message rules** (sender→account, merchant→category), review detected transactions, card mapping, plus **automatic person-to-person transfer matching** |

> **Insights** no longer has its own tab — open it from the chart icon in the Budget header.
> That freed the fifth slot for **People**, which needs to be one tap away.

## Features that actually work

- **Add income/expense** — custom numeric keypad, category picker, account, date-time, note
- **Edit & delete transactions** — account balances adjust correctly both ways, with undo on delete
- **Category budgets** — slider + exact input, quick amounts, instant recalculation
- **Auto-balance** — redistributes the whole budget total based on your real spending mix
- **Savings goals** — create goals, add money (deducts from cash), progress rings
- **Month switcher** — look back at previous months' budgets and spend
- **Search & filter** — full transaction list by text, type, or month
- **Wallet** — add accounts, adjust balances, drill into account activity
- **Settings** — name, 6 currencies (PKR/USD/EUR/GBP/INR/AED), dark/light theme, reset
- **Export** — copy or download a JSON backup
- **Lend & borrow** — per-person net balance, full or partial settlement, reminders by WhatsApp
- **Split a bill** — one payer, N debtors, exact remainder handling, optional expense logging
- **Groups** — bundle shared outings and settle the whole group at once
- **Message rules** — sender→account and merchant→category, editable, learnable from one transaction
- **SMS relay** — forward bank SMS from your phone and Budge logs it automatically
- **SMS transfer matching** — auto-settles incoming and outgoing person transfers from bank SMS
- **Split an existing transaction** — turn any Autopilot-caught payment into IOUs without double-logging it
- **One-tap reminders** — itemised WhatsApp message, pre-addressed; call and SMS alongside
- **Persistence** — saved to `localStorage`; falls back to in-memory if storage is blocked

## People, splits & settling up

Three ideas, one screen.

**Lend & borrow.** Pick a person and a direction — *lend* means you paid for them,
*borrow* means they paid for you. Each entry is either a receivable or a payable, and
the People header always shows both totals. Every contact has a single net balance, so
if Sana owes you Rs 1,200 for dinner but you borrowed Rs 3,000 from her last month, the
app shows one clean line: *you owe her Rs 1,800*.

**Split a bill.** This models the way a group meal actually works — one person pays the
whole bill, everyone else transfers their share:

- Enter the total, who paid, and who was in on it
- The app divides by the number of people, rounds to two decimals, and lets the payer
  absorb the remainder so the shares always add back to the exact total
- **If you paid:** every other person gets a debt for their share, and the whole bill is
  optionally logged as one expense against a category and account
- **If someone else paid:** you get a single payable for just your share — no fake
  income, no double counting
- Groups (Friday dinner, office lunch, trip fund) keep recurring outings together so you
  can see who still owes what after the third dinner in a row

**Split a payment that already happened.** When Autopilot logs a restaurant payment from
your bank email, that expense is already on your books. Open the transaction and tap
**Split this with people** — pick who was there, and the app records only the IOUs. It
never posts the expense twice and never moves the account balance again. The transaction
remembers its split, so reopening it shows the full breakdown. "Rs 3,000 at a restaurant,
split 6 ways" is two taps after the email arrives.

**Settle up.** Settling nets both directions at once instead of making you close debts one
by one — items are cleared oldest-first and the chosen account balance moves by the net
amount. Partial payments shrink the oldest item and leave the rest open, so "he sent half
now and the rest on Friday" is a normal state.

## Message rules — "this number means JazzCash", "Rs 421 is Amazon Prime"

Autopilot reads **bank SMS only**, and it learns
what each message is from rules you set once.

**Sender rules** decide the account. A message from `8556` goes to JazzCash; from
`ASKARI` to Askari Bank; from `HBL` to HBL Bank. Six are seeded for Askari, HBL,
JazzCash, Easypaisa, NayaPay and SadaPay, and you can add more.

**Merchant rules** decide the name and category. Teach it *"Rs 421 from a bank
alert is Amazon Prime Video"* once and every future 421 — from any bank — is
filed as Amazon Prime Video under Entertainment, without you touching it. A rule
can match on amount, on a keyword in the text, or both.

Every message resolves through the same pipeline:

```
message → sender rule → account
        → merchant rule → name + category
        → direction (debited / credited) → expense or income
        → auto-posted, or queued if unsure
```

**How messages get in** (a web page genuinely cannot read your SMS — Android
reserves that for the default messaging app):

| Route | Setup | Automatic? |
|---|---|---|
| **SMS relay** | `server/sms_server.py` + any SMS-forwarder app on your phone | Yes — polls every 15s |
| **Paste** | Autopilot → Bank messages → Paste | One tap |
| **SMS** | Reads bank SMS on the phone | Yes |

The relay is the real answer for SMS: your phone forwards bank messages to a
small local server, and Budge reads them from there. Nothing leaves your Wi-Fi.

The rules live in Settings-adjacent space on the Autopilot screen — **Message
rules** shows every sender→account and merchant mapping, and any of them can be
edited, paused or deleted. Teach one straight from a transaction with **Always
treat this sender this way**.

**Honest limits:** rules match text patterns, not a bank's database. A bank that
changes its alert wording, or a merchant whose name the bank truncates differently
each time, may need a rule tweak. That is why every parse shows its confidence and
anything below the threshold waits for you instead of guessing.

## Automatic settlement from bank SMS

The point of the People screen is that you should not have to type a settlement. Bank SMS
sync does the work:

1. Every synced email is run through a transfer parser that recognises the wording and
   senders used by **Raast, IBFT, Easypaisa, JazzCash, SadaPay, NayaPay**, plus Meezan,
   HBL, UBL and Askari alerts.
2. The amount is read from the email, and the sender or recipient name is matched against
   your contacts — full name first, then first name, then email address.
3. Direction is inferred from the verbs ("sent you" = money in, "you sent" = money out),
   and a confidence score is built from the amount found, whether the person is already a
   known contact, and whether a real bank keyword appears.
4. **Anything at 85% confidence or better from a known contact settles itself on arrival** —
   no tap, no queue. Older debts close oldest-first, partial payments are applied, and any
   excess is recorded as a plain transfer rather than quietly creating a fake debt.
5. Lower-confidence matches land in a review queue on the Autopilot screen, where each one
   shows its match percentage, the bank, and the source email address. Approving settles the
   debt and moves the account balance; ignoring leaves your books untouched.
6. A transfer from someone who isn't in your contacts yet gets a contact created
   automatically, so the ledger stays complete.

The Autopilot screen keeps a running *"auto-settled from your inbox"* log so you can see
exactly what the app did on your behalf.

## Reminders that don't need typing

Tap **Remind** on anyone who owes you and the app writes the message for you — the amount,
each item with its date, and a short note — then opens WhatsApp with their number already
filled in and the full text pre-typed. That is the one step no website can finish: WhatsApp
requires a human finger on **send**, so Budge hands you a ready-to-send chat rather than
pretending to send it. **Call** and **SMS** buttons sit next to it for the same contact.
Add a phone number once and every nudge after that is a single tap; the sheet shows when you
last nudged them.

**One honest caveat:** name extraction from real bank emails is a heuristic, not a lookup.
Real bank alerts are wildly inconsistent — some say "IBFT from HAMZA SHEIKH", others only
show the last four digits of an IBFT reference. Known contacts and bank-specific senders
parse reliably; a first-time sender with an unusual format may be missed or land in the
review queue at low confidence. That is why the queue exists rather than everything being
silently auto-approved.

## Design notes

- Mobile-first: full-bleed app below 560px, framed phone mockup with a marketing panel on desktop
- Design tokens in CSS custom properties, so dark and light themes are a single attribute swap
- Inline SVG icon set and charts — no external assets, nothing to fail to load
- Respects `prefers-reduced-motion`; keyboard shortcuts on desktop (`N` = new, `1`–`6` = Home, Budget, Monthly, People, Wallet, Auto)

## Files

```
index.html           ← the app (self-contained) — open this
src.html             ← HTML + CSS shell with a /*APP_JS*/ placeholder
app-core.js          ← icons, state, demo data, recurring + email parsing, people balances
app-render.js        ← screen and chart rendering, including People and split inbox
app-ui.js            ← navigation, sheets, forms, event wiring, split/settle/transfer flows
build.py             ← inlines the three JS files into index.html
server/sms_server.py    ← SMS relay (phone forwards SMS → Budge), port 5179
server/README.md        ← setup for both: forwarding apps, Google Cloud, LAN
```

`server/credentials.json` and `server/.tokens.json` are gitignored — never commit them.

Edit the source files, then run `python3 build.py` to regenerate `index.html`.

## About the demo data

All people, merchants and amounts are fictional sample data for Karachi-based examples.
Budge is not connected to any bank and stores nothing on a server.
