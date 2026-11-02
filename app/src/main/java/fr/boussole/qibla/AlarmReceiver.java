package fr.boussole.qibla;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        long t = intent.getLongExtra("t", 0);
        SharedPreferences p = AlarmScheduler.prefs(ctx);
        if (t > p.getLong(AlarmScheduler.K_LAST, 0)) {
            p.edit().putLong(AlarmScheduler.K_LAST, t).apply();
        }
        String mode = intent.getStringExtra("mode");
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");
        if ("adhan".equals(mode)) {
            try {
                Intent s = new Intent(ctx, AdhanService.class);
                s.putExtra("title", title);
                s.putExtra("text", text);
                ctx.startForegroundService(s);
            } catch (Exception e) {
                Notifs.show(ctx, title, text);
            }
        } else {
            Notifs.show(ctx, title, text);
        }
        AlarmScheduler.scheduleNext(ctx);
    }
}
