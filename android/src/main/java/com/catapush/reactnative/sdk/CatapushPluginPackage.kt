package com.catapush.reactnative.sdk

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CatapushPluginPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext):
            MutableList<NativeModule> {
        return mutableListOf(CatapushPluginModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext):
            MutableList<ViewManager<*, *>> {
        return mutableListOf()
    }

}
