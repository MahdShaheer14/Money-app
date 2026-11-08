package com.budge.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/** One parsed money movement, ready for the UI. */
@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    /** Which bank/wallet this came from: "HBL", "JazzCash", "Askari", ... */
    val account: String,
    /** Display name: "Amazon Prime Video", "Foodpanda", a person's name, ... */
    val title: String,
    val amount: Double,
    /** TransactionType.DEBIT or TransactionType.CREDIT */
    val type: String,
    val category: String,
    /** Raw sender, e.g. "8556" or "HBL" */
    val sender: String,
    /** Full SMS body, kept so a rule can be re-run later */
    val rawMessage: String,
    /** 0..1 — how sure the parser is */
    val confidence: Double,
    /** Epoch millis the SMS was received */
    val receivedAt: Long,
    /** True when the user later confirmed or corrected it */
    val reviewed: Boolean = false
)

/** A user rule: "messages from 8556 are JazzCash", "421 is Amazon Prime". */
@Entity(tableName = "rules")
data class RuleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    /** RuleKind.SENDER or RuleKind.MERCHANT */
    val kind: String,
    /** SENDER rules: the number or name to match. */
    val matchSender: String = "",
    /** SENDER rules: which account it maps to. */
    val account: String = "",
    /** MERCHANT rules: the name to give the transaction. */
    val merchant: String = "",
    /** MERCHANT rules: only fire on this exact amount (null = any). */
    val amount: Double? = null,
    /** MERCHANT rules: only fire if the text contains this word. */
    val keyword: String = "",
    val category: String = "Uncategorised",
    val enabled: Boolean = true
)

object TransactionType {
    const val DEBIT = "DEBIT"    // money left your account
    const val CREDIT = "CREDIT"  // money came in
}

object RuleKind {
    const val SENDER = "SENDER"
    const val MERCHANT = "MERCHANT"
}
