package com.catapush.reactnative.sdk

interface IStatusDispatchDelegate {
    fun dispatchConnectionStatus(status: String)
    fun dispatchError(event: String, code: Int)
}