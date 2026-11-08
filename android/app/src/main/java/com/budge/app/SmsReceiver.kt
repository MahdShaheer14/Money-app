package com.budge.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.budge.app.data.BudgeDatabase
import com.budge.app.data.TransactionEntity
import com.budge.app.data.TransactionType
import com.budge.app.parse.SmsParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Runs the moment a bank SMS arrives — no app open required.
 *
 * Flow:
 *   SMS → extract sender + body → SmsParser (with the user's rules)
 *       → Room insert → the UI updates itself via Flow
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        if (messages.isEmpty()) return

        // A long SMS arrives as several parts; stitch them back together.
        val sender = messages.firstOrNull()?.originatingAddress ?: "unknown"
        val body = messages.joinToString(separator = "") { it.messageBody ?: "" }
        val receivedAt = messages.firstOrNull()?.timestampMillis?.takeIf { it > 0 }
            ?: System.currentTimeMillis()

        if (body.isBlank()) return

        val pending = goAsync()   // keeps the process alive during the DB write
        val appContext = context.applicationContext

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = BudgeDatabase.get(appContext)
                val rules = db.rules().active()

                val parsed = SmsParser.parse(
                    sender = sender,
                    body = body,
                    receivedAt = receivedAt,
                    rules = rules
                ) ?: return@launch

                // never log the same SMS twice
                db.transactions().findDuplicate(parsed.rawMessage, parsed.receivedAt)
                    ?.let { return@launch }

                db.transactions().insert(parsed)

                if (parsed.type == TransactionType.DEBIT && parsed.amount > 0) {
                    NotificationHelper.showDebit(appContext, parsed)
                }
            } catch (e: Exception) {
                Log.w(TAG, "could not process SMS", e)
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        private const val TAG = "BudgeSmsReceiver"
    }
}
