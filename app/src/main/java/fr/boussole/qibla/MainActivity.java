package fr.boussole.qibla;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity implements SensorEventListener {

    private static final int REQ_LOCATION = 1;
    private static final int REQ_NOTIF = 2;
    private static final String HOST = "appassets.androidplatform.net";

    private WebView web;
    private GeolocationPermissions.Callback pendingCallback;
    private String pendingOrigin;

    private SensorManager sensors;
    private boolean compassOn;
    private float declination;
    private long lastPost;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Notifs.ensureChannels(this);
        sensors = (SensorManager) getSystemService(Context.SENSOR_SERVICE);

        web = new WebView(this);
        setContentView(web);
        web.setKeepScreenOn(true);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bridge(), "AndroidApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                boolean granted =
                        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                if (granted) {
                    callback.invoke(origin, true, false);
                } else {
                    pendingCallback = callback;
                    pendingOrigin = origin;
                    requestPermissions(new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                    }, REQ_LOCATION);
                }
            }
        });

        web.loadUrl("https://" + HOST + "/assets/index.html");
    }

    /** Pont appelé depuis la page (window.AndroidApp.*). */
    private class Bridge {
        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public void setSchedule(String json) {
            AlarmScheduler.saveSchedule(MainActivity.this, json);
            AlarmScheduler.scheduleNext(MainActivity.this);
        }

        @JavascriptInterface
        public void setSettings(float volume, boolean vibrate) {
            AlarmScheduler.prefs(MainActivity.this).edit()
                    .putFloat(AlarmScheduler.K_VOLUME, volume)
                    .putBoolean(AlarmScheduler.K_VIBRATE, vibrate)
                    .apply();
        }

        @JavascriptInterface
        public boolean hasNotifPermission() {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            return nm.areNotificationsEnabled();
        }

        @JavascriptInterface
        public void requestNotifPermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= 33
                            && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
                    }
                }
            });
        }

        @JavascriptInterface
        public void testNotification(boolean adhan) {
            if (adhan) {
                try {
                    Intent s = new Intent(MainActivity.this, AdhanService.class);
                    s.putExtra("title", "Test de l’adhan");
                    s.putExtra("text", "Appuyez sur Arrêter pour couper le son");
                    startForegroundService(s);
                } catch (Exception e) {
                    Notifs.show(MainActivity.this, "Test", "Lecture de l’adhan impossible");
                }
            } else {
                Notifs.show(MainActivity.this, "Test de notification", "Les rappels fonctionnent.");
            }
        }

        @JavascriptInterface
        public boolean isAdhanPlaying() {
            return AdhanService.running;
        }

        @JavascriptInterface
        public void openNotifSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                            .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(i);
                }
            });
        }

        @JavascriptInterface
        public void stopAdhan() {
            startService(new Intent(MainActivity.this, AdhanService.class).setAction(AdhanService.ACTION_STOP));
        }

        @JavascriptInterface
        public void startCompass(final double lat, final double lon) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    declination = new GeomagneticField((float) lat, (float) lon, 0f, System.currentTimeMillis()).getDeclination();
                    compassOn = true;
                    registerCompass();
                }
            });
        }

        @JavascriptInterface
        public void stopCompass() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    compassOn = false;
                    sensors.unregisterListener(MainActivity.this);
                }
            });
        }
    }

    private void registerCompass() {
        Sensor rv = sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rv == null) {
            js("window.__compassUnavailable&&window.__compassUnavailable()");
            return;
        }
        sensors.unregisterListener(this);
        sensors.registerListener(this, rv, SensorManager.SENSOR_DELAY_GAME);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        long now = System.currentTimeMillis();
        if (now - lastPost < 40) {
            return;
        }
        lastPost = now;
        float[] r = new float[9];
        float[] r2 = new float[9];
        float[] o = new float[3];
        SensorManager.getRotationMatrixFromVector(r, event.values);
        // Téléphone à plat : on lit l'azimut du haut du téléphone.
        // Téléphone redressé : on lit l'azimut de la direction vers laquelle regarde l'arrière.
        if (Math.abs(r[8]) < 0.6f) {
            SensorManager.remapCoordinateSystem(r, SensorManager.AXIS_X, SensorManager.AXIS_Z, r2);
            SensorManager.getOrientation(r2, o);
        } else {
            SensorManager.getOrientation(r, o);
        }
        double deg = Math.toDegrees(o[0]) + declination;
        deg = ((deg % 360) + 360) % 360;
        js("window.__heading&&window.__heading(" + deg + ")");
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private void js(String code) {
        if (web != null) {
            web.evaluateJavascript(code, null);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (compassOn) {
            registerCompass();
        }
        js("window.__resume&&window.__resume()");
    }

    @Override
    protected void onPause() {
        sensors.unregisterListener(this);
        super.onPause();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION && pendingCallback != null) {
            boolean ok = false;
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_GRANTED) {
                    ok = true;
                }
            }
            pendingCallback.invoke(pendingOrigin, ok, false);
            pendingCallback = null;
            pendingOrigin = null;
        } else if (requestCode == REQ_NOTIF) {
            js("window.__resume&&window.__resume()");
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
