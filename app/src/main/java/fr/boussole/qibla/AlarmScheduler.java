package fr.boussole.qibla;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Programme la prochaine alarme à partir du planning (30 jours) envoyé par la page. */
public final class AlarmScheduler {

    static final String PREFS = "qibla_native";
    static final String K_SCHEDULE = "schedule";
    static final String K_LAST = "last_fired";
    static final String K_VOLUME = "volume";
    static final String K_VIBRATE = "vibrate";
    static final String K_STOP_LABEL = "stop_label";
    static final String K_TEST_TITLE = "test_title";
    static final String K_TEST_TEXT = "test_text";

    private AlarmScheduler() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void saveSchedule(Context c, String json) {
        prefs(c).edit().putString(K_SCHEDULE, json).apply();
    }

    static void scheduleNext(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 0,
                new Intent(c, AlarmReceiver.class).setAction("fr.boussole.qibla.ALARM"),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) {
            am.cancel(pi);
        }

        SharedPreferences p = prefs(c);
        long last = p.getLong(K_LAST, 0);
        long now = System.currentTimeMillis();
        JSONObject best = null;
        long bestT = Long.MAX_VALUE;
        try {
            JSONArray arr = new JSONArray(p.getString(K_SCHEDULE, "[]"));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                long t = o.getLong("t");
                if (t > last && t > now - 120000L && t < bestT) {
                    best = o;
                    bestT = t;
                }
            }
        } catch (Exception ignored) {
            return;
        }
        if (best == null) {
            return;
        }

        Intent in = new Intent(c, AlarmReceiver.class).setAction("fr.boussole.qibla.ALARM");
        in.putExtra("t", bestT);
        in.putExtra("title", best.optString("title"));
        in.putExtra("text", best.optString("text"));
        in.putExtra("mode", best.optString("mode", "notif"));
        PendingIntent fire = PendingIntent.getBroadcast(c, 0, in,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        if (exact) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, bestT, fire);
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, bestT, fire);
        }
    }
}
