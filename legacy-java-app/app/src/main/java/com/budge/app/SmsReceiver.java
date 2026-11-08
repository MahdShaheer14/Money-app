package com.budge.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Date;

/**
 * Catches bank SMS the moment they arrive and hands them to the web layer.
 *
 * This is the whole reason the app exists as a native wrapper: only Android
 * can see an incoming SMS. It stores nothing else and sends nothing anywhere.
 */
public class SmsReceiver extends BroadcastReceiver {

    private static final String TAG = "BudgeSms";
    public static final String PREFS = "budge_prefs";
    public static final String KEY_QUEUE = "sms_queue";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        String format = bundle.getString("format");

        for (Object pdu : pdus) {
            try {
                SmsMessage msg = (Build.VERSION.SDK_INT >= 23)
                        ? SmsMessage.createFromPdu((byte[]) pdu, format)
                        : SmsMessage.createFromPdu((byte[]) pdu);

                if (msg == null) continue;

                String body = msg.getMessageBody();
                String sender = msg.getOriginatingAddress();
                long when = msg.getTimestampMillis();
                if (when <= 0) when = new Date().getTime();

                store(context, sender, body, when);

                MainActivity.notifyNewMessage(context, sender, body);
            } catch (Exception e) {
                Log.w(TAG, "could not read an SMS", e);
            }
        }
    }

    /** Append to a small JSON queue in SharedPreferences; the web layer drains it. */
    private static synchronized void store(Context context, String sender, String body, long when) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_QUEUE, "[]");
            JSONArray queue = new JSONArray(raw);

            // drop exact repeats — some carriers deliver twice
            for (int i = 0; i < queue.length(); i++) {
                JSONObject o = queue.optJSONObject(i);
                if (o == null) continue;
                if (body.equals(o.optString("text")) && Math.abs(when - o.optLong("when")) < 120000) {
                    return;
                }
            }

            JSONObject item = new JSONObject();
            item.put("from", sender == null ? "unknown" : sender);
            item.put("text", body == null ? "" : body);
            item.put("when", when);
            item.put("received", new Date().getTime());
            queue.put(item);

            // keep it bounded so storage can never grow without limit
            while (queue.length() > 200) queue.remove(0);

            prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
        } catch (Exception e) {
            Log.w(TAG, "could not queue SMS", e);
        }
    }
}
