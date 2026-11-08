package com.budge.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import com.budge.app.data.TransactionEntity
import com.budge.app.data.TransactionType
import java.text.NumberFormat
import java.util.Locale

/** "Payment completed" — the confirmation the brief asks for. */
object NotificationHelper {

    private const val CHANNEL = "budge_transactions"

    fun showDebit(context: Context, tx: TransactionEntity) {
        try {
            createChannel(context)
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE)
                as? NotificationManager ?: return

            val rupee = NumberFormat.getNumberInstance(Locale("en", "PK"))
            val money = "Rs ${rupee.format(tx.amount)}"

            val open = Intent(context, SmsInboxActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
            val pi = PendingIntent.getActivity(context, 0, open, flags)

            val title = if (tx.type == TransactionType.DEBIT) "Payment completed" else "Money received"
            val text = "$money · ${tx.title} · ${tx.account}"

            val builder = if (Build.VERSION.SDK_INT >= 26) {
                Notification.Builder(context, CHANNEL)
            } else {
                Notification.Builder(context)
            }

            builder.setContentTitle(title)
                .setContentText(text)
                .setStyle(Notification.BigTextStyle().bigText(text))
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setAutoCancel(true)
                .setContentIntent(pi)

            if (Build.VERSION.SDK_INT >= 21) builder.setColor(Color.parseColor("#D7FA4C"))

            nm.notify(tx.id.toInt(), builder.build())
        } catch (e: Exception) {
            // a notification failure must never lose the transaction
        }
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val channel = NotificationChannel(
            CHANNEL,
            "Transactions",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply { description = "Shown when a bank SMS is logged" }
        nm.createNotificationChannel(channel)
    }
}
