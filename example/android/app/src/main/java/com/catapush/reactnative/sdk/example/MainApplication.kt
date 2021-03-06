package com.catapush.reactnative.sdk.example

import android.annotation.SuppressLint
import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.catapush.library.Catapush
import com.catapush.library.exceptions.CatapushCompositeException
import com.catapush.library.gms.CatapushGms
import com.catapush.library.interfaces.Callback
import com.catapush.library.interfaces.IIntentProvider
import com.catapush.library.messages.CatapushMessage
import com.catapush.library.notifications.NotificationTemplate
import com.catapush.reactnative.sdk.CatapushPluginModule
import com.facebook.react.*
import com.facebook.soloader.SoLoader
import java.lang.reflect.InvocationTargetException

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean {
            return BuildConfig.DEBUG
        }

        override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(MyReactNativePackage());
            return packages
        }

        override fun getJSMainModuleName(): String {
            return "index"
        }
    }

    override fun getReactNativeHost(): ReactNativeHost {
        return mReactNativeHost
    }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        initializeFlipper(this, reactNativeHost.reactInstanceManager)

        val notificationColor = ContextCompat.getColor(this, R.color.colorPrimary)

        val notificationTemplate = NotificationTemplate.Builder(NOTIFICATION_CHANNEL_ID)
            .swipeToDismissEnabled(true)
            .vibrationEnabled(true)
            .vibrationPattern(longArrayOf(100, 200, 100, 300))
            .soundEnabled(true)
            .soundResourceUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .circleColor(notificationColor)
            .iconId(R.drawable.ic_stat_notify_default)
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
            .setNotificationIntent(object : IIntentProvider {
                @SuppressLint("UnspecifiedImmutableFlag")
                override fun getIntentForMessage(
                    message: CatapushMessage,
                    context: Context
                ): PendingIntent {
                    val intent = Intent(
                        this@MainApplication,
                        MainActivity::class.java
                    )
                    intent.data = Uri.parse("catapush://messages/" + message.id())
                    intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    intent.putExtra("message", message)
                    val requestCode = message.id().hashCode()
                    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        PendingIntent.getActivity(
                            context,
                            requestCode,
                            intent,
                            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_ONE_SHOT
                        )
                    } else {
                        PendingIntent.getActivity(
                            context,
                            requestCode,
                            intent,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_ONE_SHOT
                        )
                    }
                }
            })
            .setSecureCredentialsStoreCallback(object : Callback<Boolean> {
                override fun success(response: Boolean) {
                    Log.i(LOG_TAG, "Secure credentials storage has been initialized!")
                }

                override fun failure(irrecoverableError: Throwable) {
                    Log.w(LOG_TAG, "Can't initialize secure credentials storage.")
                    if (irrecoverableError is CatapushCompositeException) {
                        for (t in irrecoverableError.errors) {
                            Log.e(LOG_TAG, "Can't initialize secure storage", t)
                        }
                    } else {
                        Log.e(LOG_TAG, "Can't initialize secure storage", irrecoverableError)
                    }
                }
            })
            .init(this,
                CatapushPluginModule.eventDelegate,
                listOf(CatapushGms),
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

        private fun initializeFlipper(context: Context, reactInstanceManager: ReactInstanceManager) {
            if (BuildConfig.DEBUG) {
                try {
                    val aClass = Class.forName("com.catapush.reactnative.sdk.example.ReactNativeFlipper")
                    aClass
                        .getMethod("initializeFlipper", Context::class.java, ReactInstanceManager::class.java)
                        .invoke(null, context, reactInstanceManager)
                } catch (e: ClassNotFoundException) {
                    e.printStackTrace()
                } catch (e: NoSuchMethodException) {
                    e.printStackTrace()
                } catch (e: IllegalAccessException) {
                    e.printStackTrace()
                } catch (e: InvocationTargetException) {
                    e.printStackTrace()
                }
            }
        }
    }
}
