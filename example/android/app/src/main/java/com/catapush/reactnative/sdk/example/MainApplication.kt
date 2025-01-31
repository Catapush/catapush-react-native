package com.catapush.reactnative.sdk.example

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.catapush.library.Catapush
import com.catapush.library.gms.CatapushGms
import com.catapush.library.interfaces.Callback
import com.catapush.library.interfaces.ICatapushInitializer
import com.catapush.library.notifications.NotificationTemplate
import com.catapush.reactnative.sdk.CatapushPluginIntentProvider
import com.catapush.reactnative.sdk.CatapushPluginModule
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.oblador.vectoricons.VectorIconsPackage

class MainApplication : Application(), ReactApplication, ICatapushInitializer {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(VectorIconsPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }

        initCatapush()
    }

    override fun initCatapush() {
        val notificationColor = ContextCompat.getColor(this, R.color.colorPrimary)

        val notificationTemplate = NotificationTemplate.Builder(NOTIFICATION_CHANNEL_ID)
            .swipeToDismissEnabled(true)
            .vibrationEnabled(true)
            .vibrationPattern(longArrayOf(100, 200, 100, 300))
            .soundEnabled(true)
            .soundResourceUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .circleColor(notificationColor)
            .iconId(R.drawable.ic_stat_notify)
            .useAttachmentPreviewAsLargeIcon(true)
            .modalIconId(R.mipmap.ic_launcher)
            .ledEnabled(true)
            .ledColor(notificationColor)
            .ledOnMS(2000)
            .ledOffMS(1000)
            .build()

        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager?
        if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "Catapush messages"
            var channel = nm.getNotificationChannel(notificationTemplate.notificationChannelId)
            if (channel == null) {
                channel = NotificationChannel(
                    notificationTemplate.notificationChannelId,
                    channelName,
                    NotificationManager.IMPORTANCE_HIGH
                )
                channel.enableVibration(notificationTemplate.isVibrationEnabled)
                channel.vibrationPattern = notificationTemplate.vibrationPattern
                channel.enableLights(notificationTemplate.isLedEnabled)
                channel.lightColor = notificationTemplate.ledColor
                if (notificationTemplate.isSoundEnabled) {
                    val audioAttributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                        .build()
                    channel.setSound(notificationTemplate.soundResourceUri, audioAttributes)
                }
            }
            nm.createNotificationChannel(channel)
        }

        Catapush.getInstance()
            .init(this,
                this,
                CatapushPluginModule.eventDelegate,
                listOf(CatapushGms),
                CatapushPluginIntentProvider(MainActivity::class.java),
                notificationTemplate,
                null,
                object : Callback<Boolean> {
                    override fun success(response: Boolean) {
                        Log.d(LOG_TAG, "Catapush has been successfully initialized")
                    }
                    override fun failure(irrecoverableError: Throwable) {
                        Log.e(LOG_TAG, "Can't initialize Catapush!", irrecoverableError)
                    }
                })
    }

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "EXAMPLE_CHANNEL"
        const val LOG_TAG = "App"
    }
}
