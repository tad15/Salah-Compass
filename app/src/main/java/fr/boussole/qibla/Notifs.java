package fr.boussole.qibla;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

final class Notifs {

    static final String CH_NOTIF = "prayer_notif";
    static final String CH_ADHAN = "adhan_playback";

    private Notifs() {}

    static void ensureChannels(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel n = new NotificationChannel(CH_NOTIF, "Rappels de prière", NotificationManager.IMPORTANCE_HIGH);
        n.setDescription("Notification à l’heure de chaque prière");
        nm.createNotificationChannel(n);
        NotificationChannel a = new NotificationChannel(CH_ADHAN, "Adhan", NotificationManager.IMPORTANCE_LOW);
        a.setDescription("Affichée pendant la lecture de l’adhan");
        a.setSound(null, null);
        nm.createNotificationChannel(a);
    }

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void show(Context c, String title, String text) {
        ensureChannels(c);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        Notification n = new Notification.Builder(c, CH_NOTIF)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(text)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(openApp(c))
                .build();
        nm.notify((int) (System.currentTimeMillis() % 100000) + 10, n);
    }
}
