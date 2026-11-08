package com.budge.app.parse

import com.budge.app.data.RuleEntity
import com.budge.app.data.RuleKind
import com.budge.app.data.TransactionEntity
import com.budge.app.data.TransactionType

/**
 * Turns a bank SMS into a transaction.
 *
 * Order of authority (highest first):
 *   1. the user's own rules          — "8556 is JazzCash", "421 is Amazon Prime"
 *   2. the built-in bank catalogue   — known shortcodes and names
 *   3. regex extraction from the text
 *   4. a low-confidence fallback
 *
 * Nothing here touches Android, so it can be unit-tested with plain strings.
 */
object SmsParser {

    // ---------------------------------------------------------------
    // 1 · Sender → account
    // ---------------------------------------------------------------

    /**
     * The numbers and names Pakistani banks use. Add any new one here, or
     * let the user add it at runtime through a SENDER rule.
     */
    private val KNOWN_SENDERS: List<Triple<String, String, String>> = listOf(
        // match,        account,     friendly name
        Triple("8556",    "JazzCash",  "JazzCash"),
        Triple("jazzcash","JazzCash",  "JazzCash"),
        Triple("jazz cash","JazzCash", "JazzCash"),
        Triple("3737",    "Easypaisa", "Easypaisa"),
        Triple("easypaisa","Easypaisa","Easypaisa"),
        Triple("hbl",     "HBL",       "HBL"),
        Triple("habib bank","HBL",     "HBL"),
        Triple("askari",  "Askari",    "Askari Bank"),
        Triple("meezan",  "Meezan",    "Meezan Bank"),
        Triple("ubl",     "UBL",       "UBL"),
        Triple("nayapay", "NayaPay",   "NayaPay"),
        Triple("sadapay", "SadaPay",   "SadaPay"),
        Triple("faysal",  "Faysal",    "Faysal Bank"),
        Triple("alfalah", "Alfalah",   "Bank Alfalah"),
        Triple("mcb",     "MCB",       "MCB"),
        Triple("bop",     "BOP",       "Bank of Punjab")
    )

    /**
     * Which account does this sender belong to?
     * User rules win over the built-in list.
     */
    fun resolveAccount(sender: String, rules: List<RuleEntity> = emptyList()): String {
        val s = sender.trim().lowercase()

        // 1 · the user's own sender rules
        rules.filter { it.kind == RuleKind.SENDER && it.enabled }
            .sortedByDescending { it.matchSender.isNotEmpty() }
            .forEach { rule ->
                val needle = rule.matchSender.trim().lowercase()
                if (needle.isNotEmpty() && (s == needle || s.contains(needle))) {
                    return rule.account.ifBlank { "Other" }
                }
            }

        // 2 · built-in catalogue
        KNOWN_SENDERS.forEach { (match, account, _) ->
            if (s == match || s.contains(match)) return account
        }

        return "Other"
    }

    // ---------------------------------------------------------------
    // 2 · Amount
    // ---------------------------------------------------------------

    /**
     * Pull the money out of the message.
     *
     * Handles: "Rs. 1,250.50", "PKR 421", "Rs 3000", "1,850.00" near a money
     * word. Rejects the "Available balance Rs 285,879" figure that follows,
     * which is the classic way a naive regex posts a 6-figure transaction.
     */
    private val AMOUNT_PATTERNS = listOf(
        // Rs. 1,250.50 / PKR 421 / Rs 3,000
        Regex("""(?:rs\.?|pkr|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
        // "amount of 1,250.00" / "debited with 421"
        Regex("""(?:amount|amt|with|of|for)\s*(?:rs\.?\s*|pkr\s*)?([0-9][0-9,]*(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
        // bare "1,250.00"
        Regex("""\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)\b""")
    )

    /** Words that mean money left you. */
    private val DEBIT_WORDS = Regex(
        """\b(debited|debit|withdrawn|withdrawal|withdrew|spent|paid|purchase[d]?|sent|transferred to|deducted|charged|dr)\b""",
        RegexOption.IGNORE_CASE
    )

    /** Words that mean money came in. */
    private val CREDIT_WORDS = Regex(
        """\b(credited|credit|received|deposited|deposit|refund(ed)?|reversed|cash in|money in|added|cr)\b""",
        RegexOption.IGNORE_CASE
    )

    /** Not a real transaction: OTPs, balances, statements, marketing. */
    private val NOISE = Regex(
        """\b(otp|verification code|one time password|do not share|pin code|statement is ready|e-?statement|promo|offer for you|discount of)\b""",
        RegexOption.IGNORE_CASE
    )

    /** The balance figure, so we never mistake it for the transaction amount. */
    private val BALANCE_TAIL = Regex(
        """(?:avail(?:able)?|remaining|new|current|total|closing)\s*(?:bal(?:ance)?)[^0-9]{0,12}[0-9][0-9,]*(?:\.[0-9]{1,2})?""",
        RegexOption.IGNORE_CASE
    )

    fun parseAmount(text: String): Double {
        // strip the balance clause so "Avail Bal: PKR 285,879" can't win
        val cleaned = text.replace(BALANCE_TAIL, " ")

        for (pattern in AMOUNT_PATTERNS) {
            val hit = pattern.find(cleaned) ?: continue
            val raw = hit.groupValues[1].replace(",", "")
            val value = raw.toDoubleOrNull() ?: continue
            if (value > 0.0 && value < 100_000_000.0) return value
        }
        return 0.0
    }

    fun parseType(text: String): String {
        val debit = DEBIT_WORDS.find(text) != null
        val credit = CREDIT_WORDS.find(text) != null

        return when {
            // "debited" beats "received" when both appear
            debit -> TransactionType.DEBIT
            credit -> TransactionType.CREDIT
            // "sent to ALI" with no other verb is still money going out
            Regex("""\bsent to\b""", RegexOption.IGNORE_CASE).containsMatchIn(text) -> TransactionType.DEBIT
            else -> TransactionType.DEBIT
        }
    }

    // ---------------------------------------------------------------
    // 3 · Merchant name
    // ---------------------------------------------------------------

    private val BRANDS = listOf(
        Regex("""amazon\s*prime(\s*video)?|prime\s*video|amzn|amazon""", RegexOption.IGNORE_CASE)
            to ("Amazon Prime Video" to "Entertainment"),
        Regex("""netflix""", RegexOption.IGNORE_CASE) to ("Netflix" to "Entertainment"),
        Regex("""spotify""", RegexOption.IGNORE_CASE) to ("Spotify" to "Entertainment"),
        Regex("""foodpanda|food\s*panda""", RegexOption.IGNORE_CASE) to ("Foodpanda" to "Dining"),
        Regex("""daraz""", RegexOption.IGNORE_CASE) to ("Daraz" to "Shopping"),
        Regex("""careem""", RegexOption.IGNORE_CASE) to ("Careem" to "Transport"),
        Regex("""\buber\b""", RegexOption.IGNORE_CASE) to ("Uber" to "Transport"),
        Regex("""imtiaz""", RegexOption.IGNORE_CASE) to ("Imtiaz" to "Groceries"),
        Regex("""k-?electric""", RegexOption.IGNORE_CASE) to ("K-Electric" to "Bills"),
        Regex("""stormfiber""", RegexOption.IGNORE_CASE) to ("StormFiber" to "Bills"),
        Regex("""\bzong\b""", RegexOption.IGNORE_CASE) to ("Zong" to "Bills"),
        Regex("""\bptcl\b""", RegexOption.IGNORE_CASE) to ("PTCL" to "Bills"),
        Regex("""mcdonald|kfc|pizza\s*hut|domino|burger\s*king|hardee|subway""", RegexOption.IGNORE_CASE)
            to ("Restaurant" to "Dining"),
        Regex("""naheed|metro|hyperstar|carrefour|chase\s*up""", RegexOption.IGNORE_CASE)
            to ("Supermarket" to "Groceries"),
        Regex("""steam|playstation|xbox""", RegexOption.IGNORE_CASE) to ("Gaming" to "Entertainment")
    )

    /** Words that end a merchant name in a bank SMS. */
    private val MERCHANT_TAIL = Regex(
        """\b(avail(?:able)?|bal(?:ance)?|remaining|txn|tid|ref|on|dated|at|for|card|a/c|acct|thank|thanks|info)\b""",
        RegexOption.IGNORE_CASE
    )

    /** "at AMAZON PRIME VIDEO." / "to ABDUL REHMAN." / "received from SANA MALIK." */
    private val MERCHANT_AFTER_AT = Regex(
        """\b(?:at|to|@)\s+([A-Za-z0-9][A-Za-z0-9&'.\-\s]{1,42}?)(?:\.|,|\s{2,}|$)"""
    )

    private val MERCHANT_AFTER_FROM = Regex(
        """\b(?:received\s+from|credited\s+from)\s+([A-Z][A-Za-z']*(?:\s+[A-Z][A-Za-z']*){0,3})""",
        RegexOption.IGNORE_CASE
    )

    data class MerchantResult(val title: String, val category: String)

    fun parseMerchant(text: String): MerchantResult {
        // a person sending you money is the "merchant"
        MERCHANT_AFTER_FROM.find(text)?.let { m ->
            val name = m.groupValues[1].trim().trimEnd('.', ',')
            if (name.length >= 3) return MerchantResult(titleCase(name), "Transfer")
        }

        // then the brand catalogue — handles truncated ALL-CAPS bank forms
        BRANDS.forEach { (regex, pair) ->
            if (regex.containsMatchIn(text)) return MerchantResult(pair.first, pair.second)
        }

        // salary / credit without a merchant
        if (Regex("""salary|payroll""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return MerchantResult("Salary", "Salary")
        }

        // "at MERCHANT." shape
        MERCHANT_AFTER_AT.find(text)?.let { m ->
            var name = m.groupValues[1].trim()
            name = MERCHANT_TAIL.split(name).firstOrNull()?.trim().orEmpty()
            name = name.trimEnd('.', ',', ';', ':')
            if (name.length >= 3 && name.split(" ").size <= 5) {
                return MerchantResult(titleCase(name), "Uncategorised")
            }
        }

        return MerchantResult("Bank transaction", "Uncategorised")
    }

    private fun titleCase(s: String): String =
        s.lowercase().split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .joinToString(" ") { w -> w.replaceFirstChar { it.uppercase() } }

    // ---------------------------------------------------------------
    // 4 · User merchant rules — "Rs 421 = Amazon Prime Video"
    // ---------------------------------------------------------------

    private fun applyMerchantRules(
        text: String,
        amount: Double,
        rules: List<RuleEntity>
    ): MerchantResult? {
        rules.filter { it.kind == RuleKind.MERCHANT && it.enabled }.forEach { rule ->
            val amountOk = rule.amount == null || kotlin.math.abs(rule.amount - amount) < 0.5
            val keywordOk = rule.keyword.isBlank() ||
                text.contains(rule.keyword, ignoreCase = true)
            if (amountOk && keywordOk && rule.merchant.isNotBlank()) {
                return MerchantResult(rule.merchant, rule.category)
            }
        }
        return null
    }

    // ---------------------------------------------------------------
    // 5 · The whole parse
    // ---------------------------------------------------------------

    fun parse(
        sender: String,
        body: String,
        receivedAt: Long,
        rules: List<RuleEntity> = emptyList()
    ): TransactionEntity? {

        val text = body.trim()
        if (text.isEmpty()) return null
        if (NOISE.containsMatchIn(text)) return null          // OTPs and promos

        val amount = parseAmount(text)
        if (amount <= 0.0) return null                        // nothing to log

        val type = parseType(text)
        val account = resolveAccount(sender, rules)

        // Smart override first: user's own merchant rules beat everything
        val merchant = applyMerchantRules(text, amount, rules)
            ?: parseMerchant(text)

        var confidence = 0.45
        if (amount > 0) confidence += 0.20
        if (account != "Other") confidence += 0.20
        if (merchant.category != "Uncategorised") confidence += 0.10
        if (merchant.title != "Bank transaction") confidence += 0.05

        return TransactionEntity(
            account = account,
            title = merchant.title,
            amount = amount,
            type = type,
            category = merchant.category,
            sender = sender,
            rawMessage = text,
            confidence = confidence.coerceIn(0.0, 1.0),
            receivedAt = receivedAt
        )
    }

    /**
     * The exact rule from the brief, kept as a named function so it can be
     * read, tested and changed in one place.
     */
    fun isAmazonPrimeDebit(amount: Double, type: String): Boolean =
        type == TransactionType.DEBIT && kotlin.math.abs(amount - 421.0) < 0.01

    /** Rules installed on first launch so the app works out of the box. */
    fun defaultRules(): List<RuleEntity> = listOf(
        RuleEntity(kind = RuleKind.SENDER, matchSender = "8556", account = "JazzCash"),
        RuleEntity(kind = RuleKind.SENDER, matchSender = "3737", account = "Easypaisa"),
        RuleEntity(kind = RuleKind.SENDER, matchSender = "HBL", account = "HBL"),
        RuleEntity(kind = RuleKind.SENDER, matchSender = "ASKARI", account = "Askari"),
        RuleEntity(kind = RuleKind.SENDER, matchSender = "NayaPay", account = "NayaPay"),
        RuleEntity(kind = RuleKind.SENDER, matchSender = "SadaPay", account = "SadaPay"),
        RuleEntity(
            kind = RuleKind.MERCHANT,
            merchant = "Amazon Prime Video",
            amount = 421.0,
            category = "Entertainment"
        )
    )
}
