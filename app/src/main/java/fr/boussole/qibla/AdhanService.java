package fr.boussole.qibla;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.content.pm.ServiceInfo;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;

/** Joue l'adhan (assets/adhan.mp3) au premier plan pour que le système ne l'interrompe pas. */
public class AdhanService extends Service {

    static final String ACTION_STOP = "fr.boussole.qibla.STOP_ADHAN";
    private static final int NOTIF_ID = 7;

    private MediaPlayer player;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : null;
        String text = intent != null ? intent.getStringExtra("text") : null;
        if (title == null) title = "Adhan";
        if (text == null) text = "";

        Notifs.ensureChannels(this);
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, AdhanService.class).setAction(ACTION_STOP),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, Notifs.CH_ADHAN)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(text)
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_ALARM)
                .setContentIntent(Notifs.openApp(this))
                .addAction(new Notification.Action.Builder(
                        Icon.createWithResource(this, R.drawable.ic_stat), "Arrêter", stop).build())
                .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, n);
        }

        stopPlayback();
        try {
            float vol = AlarmScheduler.prefs(this).getFloat(AlarmScheduler.K_VOLUME, 0.8f);
            boolean vib = AlarmScheduler.prefs(this).getBoolean(AlarmScheduler.K_VIBRATE, true);
            AssetFileDescriptor afd = getAssets().openFd("adhan.mp3");
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            player.setWakeMode(this, android.os.PowerManager.PARTIAL_WAKE_LOCK);
            player.prepare();
            player.setVolume(vol, vol);
            player.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    stopPlayback();
                    stopSelf();
                }
            });
            player.start();
            if (vib) {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) {
                    v.vibrate(VibrationEffect.createWaveform(new long[]{0, 400, 200, 400}, -1));
                }
            }
        } catch (Exception e) {
            stopPlayback();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void stopPlayback() {
        if (player != null) {
            try {
                player.stop();
            } catch (Exception ignored) {
            }
            player.release();
            player = null;
        }
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }
}
