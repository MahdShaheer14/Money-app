package com.budge.app

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.Telephony
import android.util.Log
import com.budge.app.data.BudgeDatabase
import com.budge.app.data.TransactionType
import com.budge.app.parse.SmsParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Reads bank SMS that were already on the phone before Budge was installed.
 *
 * Optional but valuable: without it the app looks empty on day one and only
 * starts tracking from the first message after install. This picks up the last
 * 30 days instead, so the numbers are useful immediately.
 */
object SmsBackfill {

    private const val TAG = "BudgeBackfill"
    private const val DAYS = 30

    fun importRecent(context: Context) {
        val appContext = context.applicationContext
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val since = System.currentTimeMillis() - DAYS * 24L * 60L * 60L * 1000L
                val resolver: ContentResolver = appContext.contentResolver
                val uri: Uri = Uri.parse("content://sms/inbox")

                val projection = arrayOf(
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE
                )

                resolver.query(
                    uri, projection,
                    "${Telephony.Sms.DATE} > ?",
                    arrayOf(since.toString()),
                    "${Telephony.Sms.DATE} DESC"
                )?.use { cursor ->
                    val addressIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
                    val bodyIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
                    val dateIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)

                    val db = BudgeDatabase.get(appContext)
                    val rules = db.rules().active()
                    var added = 0

                    while (cursor.moveToNext() && added < 300) {
                        val sender = cursor.getString(addressIdx) ?: continue
                        val body = cursor.getString(bodyIdx) ?: continue
                        val date = cursor.getLong(dateIdx)

                        val parsed = SmsParser.parse(sender, body, date, rules) ?: continue
                        if (db.transactions().findDuplicate(parsed.rawMessage, parsed.receivedAt) != null) continue

                        db.transactions().insert(parsed)
                        added++
                    }
                    if (added > 0) Log.i(TAG, "imported $added existing transactions")
                }
            } catch (e: SecurityException) {
                Log.w(TAG, "no permission to read the SMS inbox", e)
            } catch (e: Exception) {
                Log.w(TAG, "backfill failed", e)
            }
        }
    }
}
