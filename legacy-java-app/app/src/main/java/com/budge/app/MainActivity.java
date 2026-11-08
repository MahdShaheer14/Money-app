package com.budge.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.ArrayList;
import java.util.List;

/**
 * The app shell. All of Budge's UI and logic live in index.html inside assets/;
 * this class only provides what a web page cannot do by itself:
 *
 *   1. read incoming SMS  (via SmsReceiver + the queue drained here)
 *   2. ask for the SMS permission
 *   3. show a notification when a bank message is recognised
 */
public class MainActivity extends Activity {

    private static final int REQ_SMS = 4401;
    private static final String CHANNEL = "budge_alerts";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(Color.parseColor("#0A0B0E"));
            getWindow().setNavigationBarColor(Color.parseColor("#0A0B0E"));
        }

        createChannel();

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);              // localStorage, so your data persists
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);

        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.setBackgroundColor(Color.parseColor("#0A0B0E"));
        web.addJavascriptInterface(new Bridge(), "Budge");

        web.loadUrl("file:///android_asset/index.html");

        if (hasSmsPermission()) {
            drainToWebLater();
        }
    }

    // ---------------- permissions ----------------

    private boolean hasSmsPermission() {
        if (Build.VERSION.SDK_INT < 23) return true;
        return checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
    }

    private void askForSmsPermission() {
        if (Build.VERSION.SDK_INT < 23) return;
        List<String> wanted = new ArrayList<>();
        if (checkSelfPermission(Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED)
            wanted.add(Manifest.permission.RECEIVE_SMS);
        if (checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED)
            wanted.add(Manifest.permission.READ_SMS);
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
            wanted.add("android.permission.POST_NOTIFICATIONS");
        if (wanted.isEmpty()) return;
        requestPermissions(wanted.toArray(new String[0]), REQ_SMS);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == REQ_SMS) {
            boolean granted = hasSmsPermission();
            callJs("window.BudgeNative && BudgeNative.onSmsPermission(" + granted + ")");
            if (granted) drainToWeb();
        }
    }

    // ---------------- queue -> web ----------------

    private void drainToWebLater() {
        web.postDelayed(new Runnable() {
            public void run() { drainToWeb(); }
        }, 700);
    }

    /** Hand any queued SMS to the web layer, then clear them. */
    private void drainToWeb() {
        try {
            String raw = getSharedPreferences(SmsReceiver.PREFS, MODE_PRIVATE)
                    .getString(SmsReceiver.KEY_QUEUE, "[]");
            if (raw == null || raw.equals("[]")) return;
            getSharedPreferences(SmsReceiver.PREFS, MODE_PRIVATE)
                    .edit().putString(SmsReceiver.KEY_QUEUE, "[]").apply();

            String js = "window.BudgeNative && BudgeNative.onSmsBatch(" + raw + ")";
            callJs(js);
        } catch (Exception ignored) {
        }
    }

    private void callJs(final String js) {
        runOnUiThread(new Runnable() {
            public void run() {
                if (web != null) web.evaluateJavascript(js, null);
            }
        });
    }

    /** Called from SmsReceiver so the UI updates even if the app is behind. */
    public static void notifyNewMessage(Context ctx, String sender, String body) {
        try {
            String lower = (body == null ? "" : body).toLowerCase();
            // only buzz for things that look like money moving
            boolean money = lower.contains("debited") || lower.contains("credited")
                    || lower.contains("spent") || lower.contains("received")
                    || lower.contains("withdrawn") || lower.contains("paid")
                    || lower.contains("sent to") || lower.contains("purchase");
            if (!money) return;

            NotificationManager nm =
                    (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            Intent open = new Intent(ctx, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(ctx, 0, open, flags);

            String title = "Bank message from " + (sender == null ? "your bank" : sender);
            String text = body == null ? "" : body;
            if (text.length() > 110) text = text.substring(0, 107) + "…";

            Notification.Builder b = (Build.VERSION.SDK_INT >= 26)
                    ? new Notification.Builder(ctx, CHANNEL)
                    : new Notification.Builder(ctx);

            b.setContentTitle(title)
             .setContentText(text)
             .setSmallIcon(android.R.drawable.stat_notify_chat)
             .setAutoCancel(true)
             .setContentIntent(pi);
            if (Build.VERSION.SDK_INT >= 21) b.setColor(Color.parseColor("#D7FA4C"));

            nm.notify((int) (System.currentTimeMillis() % 100000), b.build());
        } catch (Exception ignored) {
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(
                CHANNEL, "Bank messages", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Shown when a bank SMS is recognised");
        nm.createNotificationChannel(ch);
    }

    // ---------------- bridge exposed to JavaScript ----------------

    public class Bridge {

        /** true when the app has permission to read SMS. */
        @JavascriptInterface
        public boolean hasSmsPermission() {
            return MainActivity.this.hasSmsPermission();
        }

        /** Show the Android permission dialog. */
        @JavascriptInterface
        public void requestSmsPermission() {
            runOnUiThread(new Runnable() {
                public void run() { askForSmsPermission(); }
            });
        }

        /** Drain anything queued while the app was closed. */
        @JavascriptInterface
        public void pollSms() {
            MainActivity.this.drainToWeb();
        }

        /** The app is running natively — used to hide the relay/paste UI. */
        @JavascriptInterface
        public String platform() {
            return "android";
        }

        @JavascriptInterface
        public void toast(String msg) {
            final String m = msg;
            runOnUiThread(new Runnable() {
                public void run() {
                    android.widget.Toast.makeText(MainActivity.this, m,
                            android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        drainToWeb();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) { web.goBack(); return; }
        super.onBackPressed();
    }
}
