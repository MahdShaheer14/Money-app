package com.budge.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.budge.app.data.BudgeDatabase
import com.budge.app.data.RuleEntity
import com.budge.app.data.TransactionEntity
import com.budge.app.data.TransactionType
import com.budge.app.parse.SmsParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * Single source of truth for the SMS screens.
 *
 * The BroadcastReceiver writes straight to Room; this ViewModel observes the
 * same tables, so the UI updates without the receiver ever touching it.
 */
class SmsViewModel(app: Application) : AndroidViewModel(app) {

    private val db = BudgeDatabase.get(app)
    private val txDao = db.transactions()
    private val ruleDao = db.rules()

    /** All transactions, newest first. */
    val transactions: StateFlow<List<TransactionEntity>> =
        txDao.observeAll().stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            emptyList()
        )

    /** All rules, for the rule manager screen. */
    val rules: StateFlow<List<RuleEntity>> =
        ruleDao.observeAll().stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            emptyList()
        )

    /** Running totals shown at the top of the screen. */
    val totals: StateFlow<Totals> =
        combine(
            txDao.observeTotal(TransactionType.DEBIT),
            txDao.observeTotal(TransactionType.CREDIT)
        ) { spent, earned ->
            Totals(spent ?: 0.0, earned ?: 0.0)
        }.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            Totals(0.0, 0.0)
        )

    private val _lastParse = MutableStateFlow<String?>(null)
    val lastParse: StateFlow<String?> = _lastParse.asStateFlow()

    init {
        // seed the example rules once so the app is useful immediately
        viewModelScope.launch {
            if (ruleDao.count() == 0) {
                SmsParser.defaultRules().forEach { ruleDao.insert(it) }
            }
        }
    }

    // ---- user actions ----

    fun delete(tx: TransactionEntity) = viewModelScope.launch {
        txDao.delete(tx.id)
    }

    fun addRule(rule: RuleEntity) = viewModelScope.launch {
        ruleDao.insert(rule)
    }

    fun deleteRule(rule: RuleEntity) = viewModelScope.launch {
        ruleDao.delete(rule.id)
    }

    /**
     * Test the parser on any text, without waiting for a real SMS.
     * Useful for building a rule against a bank's exact wording.
     */
    fun testMessage(sender: String, body: String) = viewModelScope.launch {
        val activeRules = ruleDao.active()
        val parsed = SmsParser.parse(sender, body, System.currentTimeMillis(), activeRules)
        _lastParse.value = if (parsed == null) {
            "Not a transaction — nothing would be logged."
        } else {
            "${parsed.type} · Rs ${parsed.amount} · ${parsed.title} · " +
                "${parsed.account} · ${parsed.category} " +
                "(${(parsed.confidence * 100).toInt()}% sure)"
        }
    }

    fun insertDemo(tx: TransactionEntity) = viewModelScope.launch {
        txDao.insert(tx)
    }

    data class Totals(val spent: Double, val earned: Double) {
        val net: Double get() = earned - spent
    }
}
