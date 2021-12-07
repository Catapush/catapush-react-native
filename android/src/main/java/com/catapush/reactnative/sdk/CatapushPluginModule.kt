package com.catapush.reactnative.sdk

import android.annotation.SuppressLint
import android.app.Activity
import android.util.Log
import com.catapush.library.Catapush
import com.catapush.library.interfaces.Callback
import com.catapush.library.interfaces.RecoverableErrorCallback
import com.catapush.library.messages.CatapushMessage
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter


class CatapushPluginModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
    LifecycleEventListener, IMessagesDispatchDelegate, IStatusDispatchDelegate {

    private var activity: Activity? = null

    init {
        reactContext.addLifecycleEventListener(this)
        CatapushReactNativeReceiver.setMessagesDispatcher(this)
        CatapushReactNativeReceiver.setStatusDispatcher(this)
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
        if (Catapush.getInstance().isInitialized.blockingFirst(false)) {
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
    fun sendMessage(message: ReadableMap, promise: Promise) {
        val body = message.getString("body")
        val channel = message.getString("channel")
        val replyTo = message.getString("replyTo")
        //val file = message.getMap("file")
        @SuppressLint("MissingPermission")
        if (!body.isNullOrBlank()) {
            Catapush.getInstance().sendMessage(body, channel, replyTo, object : Callback<Boolean> {
                override fun success(response: Boolean) {
                    promise.resolve(true)
                }
                override fun failure(irrecoverableError: Throwable) {
                    promise.reject("op failed", irrecoverableError.localizedMessage, irrecoverableError)
                }
            })
        } else {
            promise.reject("bad args", "Body cannot be empty. Arguments: message=$message", null)
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
            return data
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
