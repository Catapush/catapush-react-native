package com.catapush.reactnative.sdk

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.net.Uri
import android.util.Log
import com.catapush.library.Catapush
import com.catapush.library.exceptions.CatapushAuthenticationError
import com.catapush.library.exceptions.CatapushConnectionError
import com.catapush.library.exceptions.PushServicesException
import com.catapush.library.interfaces.Callback
import com.catapush.library.interfaces.ICatapushEventDelegate
import com.catapush.library.interfaces.RecoverableErrorCallback
import com.catapush.library.messages.CatapushMessage
import com.catapush.library.push.models.PushPlatformType
import com.catapush.library.push.models.PushPluginType
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.google.android.gms.common.GoogleApiAvailability
import java.lang.ref.WeakReference
import java.lang.reflect.Modifier


class CatapushPluginModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
    LifecycleEventListener, IMessagesDispatchDelegate, IStatusDispatchDelegate {

    private var activity: Activity? = null

    init {
        reactContext.addLifecycleEventListener(this)

        try {
            val pluginType = Catapush::class.java.getDeclaredField("pluginType")
            pluginType.isAccessible = true
            pluginType[Catapush.getInstance() as Catapush] = PushPluginType.ReactNative
        } catch (e: Exception) {
            Log.e("CatapushPluginModule", "Can't initialize plugin instance", e)
        }
    }

    companion object {
        private lateinit var companionContext: WeakReference<Context>
        private var messageDispatchDelegate: IMessagesDispatchDelegate? = null
        private var statusDispatchDelegate: IStatusDispatchDelegate? = null

        val eventDelegate = object : ICatapushEventDelegate {

            override fun onDisconnected(e: CatapushConnectionError) {
                statusDispatchDelegate?.dispatchConnectionStatus("DISCONNECTED")
            }

            override fun onMessageOpened(message: CatapushMessage) {
                // TODO
            }

            override fun onMessageOpenedConfirmed(message: CatapushMessage) {
                // TODO
            }

            override fun onMessageSent(message: CatapushMessage) {
                messageDispatchDelegate?.dispatchMessageSent(message)
            }

            override fun onMessageSentConfirmed(message: CatapushMessage) {
                // TODO
            }

            override fun onMessageReceived(message: CatapushMessage) {
                messageDispatchDelegate?.dispatchMessageReceived(message)
            }

            override fun onRegistrationFailed(error: CatapushAuthenticationError) {
                CatapushAuthenticationError::class.java.declaredFields.firstOrNull {
                    Modifier.isStatic(it.modifiers)
                            && it.type == Integer::class
                            && it.getInt(error) == error.reasonCode
                }?.also { statusDispatchDelegate?.dispatchError(it.name, error.reasonCode) }
            }

            override fun onConnecting() {
                statusDispatchDelegate?.dispatchConnectionStatus("CONNECTING")
            }

            override fun onConnected() {
                statusDispatchDelegate?.dispatchConnectionStatus("CONNECTED")
            }

            override fun onPushServicesError(e: PushServicesException) {
                // TODO
                if (PushPlatformType.GMS.name == e.platform && e.isUserResolvable) {
                    // It's a GMS error and it's user resolvable: show a notification to the user
                    val gmsAvailability = GoogleApiAvailability.getInstance()
                    /*gmsAvailability.setDefaultNotificationChannelId(
                        context, brandSupport.getNotificationChannelId(context)
                    )*/
                    gmsAvailability.showErrorNotification(companionContext.get()!!, e.errorCode)
                }
            }

        }
    }

    override fun getName() = "CatapushPluginModule"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf()
    }

    override fun onHostResume() {
        activity = currentActivity
    }

    override fun onHostPause() {
        // Activity `onPause`
    }

    override fun onHostDestroy() {
        activity = null
    }

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    override fun dispatchMessageReceived(message: CatapushMessage) {
        val params = Arguments.createMap()
        params.putMap("message", message.toMap())
        sendEvent("Catapush#catapushMessageReceived", params)
    }

    override fun dispatchMessageSent(message: CatapushMessage) {
        val params = Arguments.createMap()
        params.putMap("message", message.toMap())
        sendEvent("Catapush#catapushMessageSent", params)
    }

    override fun dispatchConnectionStatus(status: String) {
        val params = Arguments.createMap()
        params.putString("status", status)
        sendEvent("Catapush#catapushStateChanged", params)
    }

    override fun dispatchError(event: String, code: Int) {
        val params = Arguments.createMap()
        params.putString("event", event)
        params.putInt("code", code)
        sendEvent("Catapush#catapushHandleError", params)
    }

    @SuppressLint("RestrictedApi")
    @ReactMethod
    fun init(appId: String, promise: Promise) {
        messageDispatchDelegate = this
        statusDispatchDelegate = this
        companionContext = WeakReference(currentActivity?.applicationContext)

        if ((Catapush.getInstance() as Catapush).isInitialized.blockingFirst(false)) {
            promise.resolve(true)
        } else {
            promise.reject("bad state", Error("Please invoke Catapush.getInstance().init(...) in the Application.onCreate(...) callback of your Android native app"))
        }
    }

    @ReactMethod
    fun setUser(identifier: String, password: String, promise: Promise) {
        if (identifier.isNotBlank() && password.isNotBlank()) {
            Catapush.getInstance().setUser(identifier, password)
            promise.resolve(true)
        } else {
            promise.reject("bad args", "Arguments: identifier=$identifier password=$password", null)
        }
    }

    @ReactMethod
    fun start(promise: Promise) {
        Catapush.getInstance().start(object : RecoverableErrorCallback<Boolean> {
            override fun success(response: Boolean) {
                promise.resolve(true)
            }
            override fun warning(recoverableError: Throwable) {
                Log.w("CatapushPluginModule", "Recoverable error", recoverableError)
            }
            override fun failure(irrecoverableError: Throwable) {
                promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
            }
        })
    }

    @ReactMethod
    fun allMessages(promise: Promise) {
        Catapush.getInstance().getMessagesAsList(object : Callback<List<CatapushMessage>> {
            override fun success(response: List<CatapushMessage>) {
                promise.resolve(response.toArray())
            }
            override fun failure(irrecoverableError: Throwable) {
                promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
            }
        })
    }

    @ReactMethod
    fun enableLog(enabled: Boolean, promise: Promise) {
        if (enabled)
            Catapush.getInstance().enableLog()
        else
            Catapush.getInstance().disableLog()
        promise.resolve(true)
    }

    @ReactMethod
    fun logout(promise: Promise) {
        Catapush.getInstance().logout(object : Callback<Boolean> {
            override fun success(response: Boolean) {
                promise.resolve(true)
            }
            override fun failure(irrecoverableError: Throwable) {
                promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
            }
        })
    }

    @ReactMethod
    fun sendMessage(message: ReadableMap, promise: Promise) {
        val body = message.getString("body")
        val channel = message.getString("channel")
        val replyTo = message.getString("replyTo")
        val file = message.getMap("file")
        val fileUrl = file?.getString("url")

        @SuppressLint("MissingPermission")
        if (!fileUrl.isNullOrBlank()) {
            val uri = fileUrl.let {
                if (it.startsWith("/")) {
                    Uri.parse("file://${it}")
                } else {
                    Uri.parse(it)
                }
            }
            //val mimeType = file["mimeType"] as String?
            Catapush.getInstance().sendFile(uri, body ?: "", channel, replyTo, object : Callback<Boolean> {
                override fun success(response: Boolean) {
                    promise.resolve(true)
                }
                override fun failure(irrecoverableError: Throwable) {
                    promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
                }
            })
        } else if (!body.isNullOrBlank()) {
            Catapush.getInstance().sendMessage(body, channel, replyTo, object : Callback<Boolean> {
                override fun success(response: Boolean) {
                    promise.resolve(true)
                }
                override fun failure(irrecoverableError: Throwable) {
                    promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
                }
            })
        } else {
            promise.reject("bad args", "Please provide a body or an attachment (or both). Arguments: message=$message", null)
        }
    }

    @ReactMethod
    fun getAttachmentUrlForMessage(message: ReadableMap, promise: Promise) {
        val id = message.getString("id")
        if (id != null) {
            Catapush.getInstance().getMessageById(id, object : Callback<CatapushMessage> {
                override fun success(response: CatapushMessage) {
                    response.file().also {
                        when {
                            it != null && response.isIn -> {
                                promise.resolve(WritableNativeMap().apply {
                                    putString("url", it.remoteUri())
                                    putString("mimeType", it.type())
                                })
                            }
                            it != null && !response.isIn -> {
                                promise.resolve(WritableNativeMap().apply {
                                    putString("url", it.localUri())
                                    putString("mimeType", it.type())
                                })
                            }
                            else -> {
                                promise.reject("op failed", "getAttachmentUrlForMessage unexpected CatapushMessage state or format", null)
                            }
                        }
                    }
                }
                override fun failure(irrecoverableError: Throwable) {
                    promise.reject("op failed", "getAttachmentUrlForMessage ${irrecoverableError.localizedMessage}", irrecoverableError)
                }
            })
        } else {
            promise.reject("bad args", "Id cannot be empty. Arguments: message=$message", null)
        }
    }

    @ReactMethod
    fun resumeNotifications(promise: Promise) {
        Catapush.getInstance().resumeNotifications()
        promise.resolve(null)
    }

    @ReactMethod
    fun pauseNotifications(promise: Promise) {
        Catapush.getInstance().pauseNotifications()
        promise.resolve(null)
    }

    @ReactMethod
    fun enableNotifications(promise: Promise) {
        Catapush.getInstance().enableNotifications()
        promise.resolve(null)
    }

    @ReactMethod
    fun disableNotifications(promise: Promise) {
        Catapush.getInstance().disableNotifications()
        promise.resolve(null)
    }

    @ReactMethod
    fun sendMessageReadNotificationWithId(id: String, promise: Promise) {
        Catapush.getInstance().notifyMessageOpened(id)
        promise.resolve(true)
    }

    private fun sendEvent(
        eventName: String,
        params: WritableMap?
    ) {
        reactContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun List<CatapushMessage>.toArray() : WritableArray {
        val array = Arguments.createArray()
        forEach { array.pushMap(it.toMap()) }
        return array
    }

    private fun CatapushMessage.toMap() : WritableMap {
        val map = Arguments.createMap()
        map.putString("id", this.id())
        map.putString("body", this.body())
        map.putString("subject", this.subject())
        map.putString("previewText", this.previewText())
        map.putString("sender", this.sender())
        map.putString("channel", this.channel())
        map.putMap("optionalData", this.data()?.run {
            val data = Arguments.createMap()
            forEach { (key, value) -> data.putString(key, value) }
            return@run data
        })
        map.putString("replyToId", this.originalMessageId())
        map.putString("state", this.state())
        map.putString("receivedTime", this.receivedTime())
        map.putString("readTime", this.readTime())
        map.putString("sentTime", this.sentTime())
        map.putBoolean("hasAttachment", this.file() != null)
        return map
    }

}
