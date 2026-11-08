import com.budge.app.data.TransactionType
import com.budge.app.parse.SmsParser

var pass = 0
var fail = 0

fun check(label: String, cond: Boolean, detail: String = "") {
    if (cond) { pass++; println("PASS  $label${if (detail.isNotEmpty()) " :: $detail" else ""}") }
    else { fail++; println("FAIL  $label :: $detail") }
}

fun main() {
    val rules = SmsParser.defaultRules()

    println("=== 1 · sender → account ===")
    check("8556 is JazzCash", SmsParser.resolveAccount("8556", rules) == "JazzCash")
    check("HBL is HBL", SmsParser.resolveAccount("HBL", rules) == "HBL")
    check("Askari is Askari", SmsParser.resolveAccount("ASKARI", rules) == "Askari")
    check("3737 is Easypaisa", SmsParser.resolveAccount("3737", rules) == "Easypaisa")
    check("NayaPay is NayaPay", SmsParser.resolveAccount("NayaPay", rules) == "NayaPay")
    check("SadaPay is SadaPay", SmsParser.resolveAccount("SadaPay", rules) == "SadaPay")
    check("unknown sender → Other", SmsParser.resolveAccount("+923001234567", rules) == "Other")

    println("\n=== 2 · amount ===")
    check("Rs 421", SmsParser.parseAmount("Rs 421 debited") == 421.0)
    check("Rs. 1,250.50", SmsParser.parseAmount("Rs. 1,250.50 debited") == 1250.50)
    check("PKR 1,850.00", SmsParser.parseAmount("PKR 1,850.00 debited") == 1850.0)
    check("Rs 3000 no comma", SmsParser.parseAmount("Rs 3000 debited") == 3000.0)
    check(
        "ignores the balance figure",
        SmsParser.parseAmount("PKR 421.00 debited. Avail Bal: PKR 285,879.00") == 421.0,
        SmsParser.parseAmount("PKR 421.00 debited. Avail Bal: PKR 285,879.00").toString()
    )
    check(
        "handles 'debited with'",
        SmsParser.parseAmount("has been debited with PKR 1,850.00 on 07-11") == 1850.0
    )

    println("\n=== 3 · debit vs credit ===")
    check("debited = DEBIT",
        SmsParser.parseType("PKR 421 debited from A/C") == TransactionType.DEBIT)
    check("credited = CREDIT",
        SmsParser.parseType("PKR 95,000 credited to A/C") == TransactionType.CREDIT)
    check("received = CREDIT",
        SmsParser.parseType("Rs 3000 received from SANA") == TransactionType.CREDIT)
    check("spent = DEBIT",
        SmsParser.parseType("You spent Rs 685 at CAREEM") == TransactionType.DEBIT)
    check("sent to = DEBIT",
        SmsParser.parseType("Rs 500 sent to ABDUL REHMAN") == TransactionType.DEBIT)

    println("\n=== 4 · the Rs 421 rule ===")
    check("421 debit is Amazon Prime",
        SmsParser.isAmazonPrimeDebit(421.0, TransactionType.DEBIT))
    check("421 credit is NOT Amazon Prime",
        !SmsParser.isAmazonPrimeDebit(421.0, TransactionType.CREDIT))
    check("420 is not", !SmsParser.isAmazonPrimeDebit(420.0, TransactionType.DEBIT))

    val amazon = SmsParser.parse(
        "ASKARI",
        "Askari Bank: PKR 421.00 debited from A/C **4417 on 08-11-25 at AMAZON PRIME VIDEO. Avail Bal: PKR 285,879.00",
        System.currentTimeMillis(), rules
    )
    check("full parse → Amazon Prime Video", amazon?.title == "Amazon Prime Video", amazon?.title ?: "null")
    check("full parse → Entertainment", amazon?.category == "Entertainment", amazon?.category ?: "null")
    check("full parse → Askari", amazon?.account == "Askari", amazon?.account ?: "null")
    check("full parse → 421", amazon?.amount == 421.0, amazon?.amount.toString())
    check("full parse → DEBIT", amazon?.type == TransactionType.DEBIT)
    check("high confidence", (amazon?.confidence ?: 0.0) >= 0.85, amazon?.confidence.toString())

    println("\n=== 5 · the same 421 from a DIFFERENT bank ===")
    val amazon2 = SmsParser.parse(
        "HBL",
        "HBL: PKR 421.00 debited from A/C 9082 on 05-11-25 at AMZN Mktp. Available balance PKR 212,850.00",
        System.currentTimeMillis(), rules
    )
    check("HBL 421 also → Amazon Prime Video", amazon2?.title == "Amazon Prime Video", amazon2?.title ?: "null")
    check("and lands in HBL", amazon2?.account == "HBL", amazon2?.account ?: "null")

    println("\n=== 6 · real-world messages from every bank ===")
    data class Case(val sender: String, val body: String, val title: String, val acct: String, val amt: Double, val type: String)
    val cases = listOf(
        Case("8556", "JazzCash: Rs 3,000.00 debited from your account. Txn: Restaurant payment. Balance: Rs 15,400.00",
             "Bank transaction", "JazzCash", 3000.0, TransactionType.DEBIT),
        Case("HBL", "HBL: Your A/C 9082 has been debited with PKR 1,850.00 on 07-11-25 at FOODPANDA. Available balance PKR 211,000.00",
             "Foodpanda", "HBL", 1850.0, TransactionType.DEBIT),
        Case("3737", "Easypaisa: Rs 500 sent to ABDUL REHMAN. Your new balance is Rs 8,700.00. TID 9021011.",
             "Abdul Rehman", "Easypaisa", 500.0, TransactionType.DEBIT),
        Case("NayaPay", "NayaPay: Rs 2,340.00 debited at DARAZ. Card ending 5521. Bal Rs 29,160.00",
             "Daraz", "NayaPay", 2340.0, TransactionType.DEBIT),
        Case("SadaPay", "SadaPay: You spent Rs 685.00 at CAREEM. Available balance: Rs 12,065.00",
             "Careem", "SadaPay", 685.0, TransactionType.DEBIT),
        Case("ASKARI", "Askari Bank: PKR 95,000.00 credited to A/C **4417 on 05-11-25. Salary credit. Avail Bal: PKR 381,000.00",
             "Salary", "Askari", 95000.0, TransactionType.CREDIT),
        Case("8556", "JazzCash: Rs 3,000.00 received from SANA MALIK. Txn ID 8811234. Balance: Rs 18,400.00",
             "Sana Malik", "JazzCash", 3000.0, TransactionType.CREDIT)
    )
    cases.forEach { c ->
        val r = SmsParser.parse(c.sender, c.body, System.currentTimeMillis(), rules)
        check("${c.sender}: amount ${c.amt}", r?.amount == c.amt, r?.amount.toString())
        check("${c.sender}: account ${c.acct}", r?.account == c.acct, r?.account ?: "null")
        check("${c.sender}: type", r?.type == c.type, r?.type ?: "null")
        check("${c.sender}: title '${c.title}'", r?.title == c.title, r?.title ?: "null")
    }

    println("\n=== 7 · noise is rejected ===")
    check("OTP rejected",
        SmsParser.parse("VERIFY", "Your verification code is 481920. Do not share this OTP.", System.currentTimeMillis(), rules) == null)
    check("promo rejected",
        SmsParser.parse("HBL", "Special offer for you! Get a discount of 20% on dining.", System.currentTimeMillis(), rules) == null)
    check("empty rejected",
        SmsParser.parse("HBL", "", System.currentTimeMillis(), rules) == null)
    check("no amount rejected",
        SmsParser.parse("HBL", "Dear customer, your statement is ready.", System.currentTimeMillis(), rules) == null)

    println("\n$pass passed, $fail failed")
    if (fail > 0) kotlin.system.exitProcess(1)
}
