//
//  CatapushPluginModule.swift
//  CatapushPluginModule
//
//  Copyright © 2021 Catapush. All rights reserved.
//

import Foundation
import React
import CoreServices
import catapush_ios_sdk_pod

@objc(CatapushPluginModule)
class CatapushPluginModule: RCTEventEmitter {
    
    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(applicationDidBecomeActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(applicationWillTerminate), name: UIApplication.willTerminateNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(applicationDidEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(applicationWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }
    
    @objc public func applicationDidBecomeActive(_ application: UIApplication) {
        Catapush.applicationDidBecomeActive(application)
    }
    
    @objc public func applicationWillTerminate(_ application: UIApplication) {
        Catapush.applicationWillTerminate(application)
    }
    
    @objc public func applicationDidEnterBackground(_ application: UIApplication) {
        Catapush.applicationDidEnterBackground(application)
    }
    
    @objc public func applicationWillEnterForeground(_ application: UIApplication) {
        var error: NSError?
        Catapush.applicationWillEnterForeground(application, withError: &error)
        if let error = error {
            // Handle error...
            print("Error: \(error.localizedDescription)")
        }
    }
    
    static let catapushStatusChangedNotification = Notification.Name(rawValue: kCatapushStatusChangedNotification)
    
    var catapushDelegate: CatapushDelegateClass?
    var messagesDispatcherDelegate: MessagesDispatchDelegateClass?
    
    override func supportedEvents() -> [String]! {
        return [
            "Catapush#catapushMessageReceived",
            "Catapush#catapushMessageSent",
            "Catapush#catapushStateChanged",
            "Catapush#catapushHandleError"
        ]
    }
    
    @objc
    func pauseNotifications(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        resolve(nil)
    }
    
    @objc
    func resumeNotifications(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        resolve(nil)
    }
    
    @objc
    func enableLog(_ enabled: Bool, resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        Catapush.enableLog(enabled)
        resolve(true)
    }
    
    @objc
    func allMessages(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        resolve((Catapush.allMessages() as! [MessageIP]).map {
            return CatapushPluginModule.formatMessageID(message: $0)
        })
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func setUser(_ identifier: String, password:String, resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        Catapush.setIdentifier(identifier, andPassword: password)
        resolve(true)
    }
    
    @objc
    func `init`(_ appId: String, resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        catapushDelegate = CatapushDelegateClass(eventEmitter: self)
        messagesDispatcherDelegate = MessagesDispatchDelegateClass(eventEmitter: self)
        Catapush.setupCatapushStateDelegate(catapushDelegate, andMessagesDispatcherDelegate: messagesDispatcherDelegate)
        NotificationCenter.default.addObserver(self, selector: #selector(statusChanged), name: CatapushPluginModule.catapushStatusChangedNotification, object: nil)
        Catapush.setAppKey(appId)
        DispatchQueue.main.async {
            Catapush.registerUserNotification(UIApplication.shared.delegate as! UIResponder)
        }
        resolve(true)
    }
    
    @objc
    func start(_ resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        Catapush.start(nil)
        resolve(true)
    }
    
    @objc
    func logout(_ resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        Catapush.logoutStoredUser {
            resolve(true)
        } failure: {
            reject("op failed", "network problem", nil)
        }
    }
    
    @objc
    func sendMessage(_ args: Dictionary<String, Any>?, resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        guard let args = args else {
            reject("bad args", "Empty argument", nil)
            return
        }
        guard let text = args["body"]  as? String else {
            reject("bad args", "Body cannot be empty", nil)
            return
        }
        let channel = args["channel"] as? String
        let replyTo = args["replyTo"] as? String
        let file = args["file"] as? Dictionary<String, Any>
        let message: MessageIP?
        if let file = file, let urlString = file["url"] as? String, let url = URL(string: urlString), let mimeType = file["mimeType"] as? String, FileManager.default.fileExists(atPath: url.path){
            let data = FileManager.default.contents(atPath: url.path)
            if let channel = channel {
                if let replyTo = replyTo {
                    message = Catapush.sendMessage(withText: text, andChannel: channel, andData: data, ofType: mimeType, replyTo: replyTo)
                }else{
                    message = Catapush.sendMessage(withText: text, andChannel: channel, andData: data, ofType: mimeType)
                }
            }else{
                if let replyTo = replyTo {
                    message = Catapush.sendMessage(withText: text, andData: data, ofType: mimeType, replyTo: replyTo)
                }else{
                    message = Catapush.sendMessage(withText: text, andData: data, ofType: mimeType)
                }
            }
        } else {
            if let channel = channel {
                if let replyTo = replyTo {
                    message = Catapush.sendMessage(withText: text, andChannel: channel, replyTo: replyTo)
                }else{
                    message = Catapush.sendMessage(withText: text, andChannel: channel)
                }
            }else{
                if let replyTo = replyTo {
                    message = Catapush.sendMessage(withText: text, replyTo: replyTo)
                }else{
                    message = Catapush.sendMessage(withText: text)
                }
            }
        }
        resolve(true)
        if (message != nil) {
            sendEvent(withName: "Catapush#catapushMessageSent", body: ["message" : CatapushPluginModule.formatMessageID(message: message!)])
        }
    }
    
    @objc
    func getAttachmentUrlForMessage(_ message: Dictionary<String, Any>?, resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        guard message != nil else {
            reject("bad args", "Empty argument", nil)
            return
        }
        guard let id = message!["id"]  as? String else {
            reject("bad args", "Empty id", nil)
            return
        }
        let predicate = NSPredicate(format: "messageId = %@", id)
        let matches = Catapush.messages(with: predicate)
        guard matches.count > 0 else {
            resolve(["url": ""])
            return
        }
        let messageIP = matches.first! as! MessageIP
        if messageIP.hasMedia() {
            if messageIP.mm != nil {
                guard let mime = messageIP.mmType,
                      let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mime as CFString, nil),
                      let ext = UTTypeCopyPreferredTagWithClass(uti.takeRetainedValue(), kUTTagClassFilenameExtension) else{
                          return
                      }
                let tempDirectoryURL = NSURL.fileURL(withPath: NSTemporaryDirectory(), isDirectory: true)
                let filePath = tempDirectoryURL.appendingPathComponent("\(messageIP.messageId).\(ext.takeRetainedValue())")
                let fileManager = FileManager.default
                if fileManager.fileExists(atPath: filePath.path) {
                    resolve(["url": filePath.absoluteString, "mimeType": messageIP.mmType])
                    return
                }
                do {
                    try messageIP.mm!.write(to: filePath)
                    resolve(["url": filePath.absoluteString, "mimeType": messageIP.mmType])
                } catch {
                    reject("Could not write file", error.localizedDescription, nil)
                }
            }else{
                DispatchQueue.main.async {
                    messageIP.downloadMedia { (error, data) in
                        if(error != nil){
                            reject("Error downloadMedia", error?.localizedDescription, nil)
                        }else{
                            let predicate = NSPredicate(format: "messageId = %@", id)
                            let matches = Catapush.messages(with: predicate)
                            if matches.count > 0 {
                                let messageIP = matches.first! as! MessageIP
                                if messageIP.hasMedia() {
                                    if messageIP.mm != nil {
                                        guard let mime = messageIP.mmType,
                                              let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mime as CFString, nil),
                                              let ext = UTTypeCopyPreferredTagWithClass(uti.takeRetainedValue(), kUTTagClassFilenameExtension) else{
                                                  return
                                              }
                                        let tempDirectoryURL = NSURL.fileURL(withPath: NSTemporaryDirectory(), isDirectory: true)
                                        let filePath = tempDirectoryURL.appendingPathComponent("\(messageIP.messageId).\(ext.takeRetainedValue())")
                                        let fileManager = FileManager.default
                                        if fileManager.fileExists(atPath: filePath.path) {
                                            resolve(["url": filePath.absoluteString])
                                            return
                                        }
                                        do {
                                            try messageIP.mm!.write(to: filePath)
                                            resolve(["url": filePath.absoluteString, "mimeType": messageIP.mmType])
                                        } catch {
                                            reject("Could not write file", error.localizedDescription, nil)
                                        }
                                    }else{
                                        resolve(["url": ""])
                                    }
                                    return
                                }else{
                                    resolve(["url": ""])
                                }
                            }else{
                                resolve(["url": ""])
                            }
                        }
                    }
                }
            }
            return
        }else{
            resolve(["url": ""])
        }
    }
    
    @objc
    func sendMessageReadNotificationWithId(_ messageId: String?, resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock ) -> Void {
        guard let messageId = messageId else {
            reject("bad args", "Empty argument", nil)
            return
        }
        MessageIP.sendMessageReadNotification(withId: messageId)
        resolve(true)
    }
    
    @objc func statusChanged() {
        var status = ""
        switch Catapush.status() {
        case .CONNECTED:
            status = "connected"
            break
        case .DISCONNECTED:
            status = "disconnected"
            break
        case .CONNECTING:
            status = "connecting"
        default:
            status = "connecting"
        }
        let result: Dictionary<String, String> = [
            "status": status,
        ]
        self.sendEvent(withName: "Catapush#catapushStateChanged", body: result)
    }
    
    class CatapushDelegateClass : NSObject, CatapushDelegate{
        
        let eventEmitter: RCTEventEmitter
        
        init(eventEmitter: RCTEventEmitter) {
            self.eventEmitter = eventEmitter
        }
        
        let LONG_DELAY =  300
        let SHORT_DELAY = 30
        
        func catapushDidConnectSuccessfully(_ catapush: Catapush!) {
            
        }
        
        func catapush(_ catapush: Catapush!, didFailOperation operationName: String!, withError error: Error!) {
            let domain = (error as NSError).domain
            let code = (error as NSError).code
            if domain == CATAPUSH_ERROR_DOMAIN {
                switch code {
                case CatapushErrorCode.INVALID_APP_KEY.rawValue:
                    /*
                     Check the app id and retry.
                     [Catapush setAppKey:@"YOUR_APP_KEY"];
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "INVALID_APP_KEY", "code": CatapushErrorCode.INVALID_APP_KEY.rawValue])
                    break
                case CatapushErrorCode.USER_NOT_FOUND.rawValue:
                    /*
                     Please check if you have provided a valid username and password to Catapush via this method:
                     [Catapush setIdentifier:username andPassword:password];
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "USER_NOT_FOUND", "code": CatapushErrorCode.USER_NOT_FOUND.rawValue])
                    break
                case CatapushErrorCode.WRONG_AUTHENTICATION.rawValue:
                    /*
                     Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "WRONG_AUTHENTICATION", "code": CatapushErrorCode.WRONG_AUTHENTICATION.rawValue])
                    break
                case CatapushErrorCode.GENERIC.rawValue:
                    /*
                     An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.XMPP_MULTIPLE_LOGIN.rawValue:
                    /*
                     The same user identifier has been logged on another device, the messaging service will be stopped on this device
                     Please check that you are using a unique identifier for each device, even on devices owned by the same user.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "XMPP_MULTIPLE_LOGIN", "code": CatapushErrorCode.XMPP_MULTIPLE_LOGIN.rawValue])
                    break
                case CatapushErrorCode.API_UNAUTHORIZED.rawValue:
                    /*
                     The credentials has been rejected    Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "API_UNAUTHORIZED", "code": CatapushErrorCode.API_UNAUTHORIZED.rawValue])
                    break
                case CatapushErrorCode.API_INTERNAL_ERROR.rawValue:
                    /*
                     Internal error of the remote messaging service
                     
                     An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.REGISTRATION_BAD_REQUEST.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.REGISTRATION_FORBIDDEN_WRONG_AUTH.rawValue:
                    /*
                     Wrong auth    Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "REGISTRATION_FORBIDDEN_WRONG_AUTH", "code": CatapushErrorCode.REGISTRATION_FORBIDDEN_WRONG_AUTH.rawValue])
                    break
                case CatapushErrorCode.REGISTRATION_NOT_FOUND_APPLICATION.rawValue:
                    /*
                     Application not found
                     
                     You appplication is not found or not active.
                     You should not keep retrying.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "REGISTRATION_NOT_FOUND_APPLICATION", "code": CatapushErrorCode.REGISTRATION_NOT_FOUND_APPLICATION.rawValue])
                    break
                case CatapushErrorCode.REGISTRATION_NOT_FOUND_USER.rawValue:
                    /*
                     User not found
                     The user has been probably deleted from the Catapush app (via API or from the dashboard).
                     You should not keep retrying.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "REGISTRATION_NOT_FOUND_USER", "code": CatapushErrorCode.REGISTRATION_NOT_FOUND_USER.rawValue])
                    break
                case CatapushErrorCode.REGISTRATION_INTERNAL_ERROR.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.OAUTH_BAD_REQUEST.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.OAUTH_BAD_REQUEST_INVALID_CLIENT.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.OAUTH_BAD_REQUEST_INVALID_GRANT.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.OAUTH_INTERNAL_ERROR.rawValue:
                    /*
                     Internal error of the remote messaging service    An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     Please try again in a few minutes.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_FORBIDDEN_WRONG_AUTH.rawValue:
                    /*
                     Credentials error
                     
                     Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "UPDATE_PUSH_TOKEN_FORBIDDEN_WRONG_AUTH", "code": CatapushErrorCode.UPDATE_PUSH_TOKEN_FORBIDDEN_WRONG_AUTH.rawValue])
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_FORBIDDEN_NOT_PERMITTED.rawValue:
                    /*
                     Credentials error
                     
                     Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "UPDATE_PUSH_TOKEN_FORBIDDEN_NOT_PERMITTED", "code": CatapushErrorCode.UPDATE_PUSH_TOKEN_FORBIDDEN_NOT_PERMITTED.rawValue])
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_CUSTOMER.rawValue:
                    /*
                     Application error
                     
                     You appplication is not found or not active.
                     You should not keep retrying.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "UPDATE_PUSH_TOKEN_NOT_FOUND_CUSTOMER", "code": CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_CUSTOMER.rawValue])
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_APPLICATION.rawValue:
                    /*
                     Application not found
                     
                     You appplication is not found or not active.
                     You should not keep retrying.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "UPDATE_PUSH_TOKEN_NOT_FOUND_APPLICATION", "code": CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_APPLICATION.rawValue])
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_USER.rawValue:
                    /*
                     User not found
                     
                     Please verify your identifier and password validity. The user might have been deleted from the Catapush app (via API or from the dashboard) or the password has changed.
                     You should not keep retrying, delete the stored credentials.
                     Provide a new identifier to this installation to solve the issue.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "UPDATE_PUSH_TOKEN_NOT_FOUND_USER", "code": CatapushErrorCode.UPDATE_PUSH_TOKEN_NOT_FOUND_USER.rawValue])
                    break
                case CatapushErrorCode.UPDATE_PUSH_TOKEN_INTERNAL_ERROR.rawValue:
                    /*
                     Internal error of the remote messaging service when updating the push token.
                     
                     Nothing, it's handled automatically by the sdk.
                     An unexpected internal error on the remote messaging service has occurred.
                     This is probably due to a temporary service disruption.
                     */
                    self.retry(delayInSeconds: LONG_DELAY)
                    break
                case CatapushErrorCode.NETWORK_ERROR.rawValue:
                    /*
                     The SDK couldn’t establish a connection to the Catapush remote messaging service.
                     
                     The device is not connected to the internet or it might be blocked by a firewall or the remote messaging service might be temporarily disrupted.    Please check your internet connection and try to reconnect again.
                     */
                    self.retry(delayInSeconds: SHORT_DELAY)
                    break
                case CatapushErrorCode.PUSH_TOKEN_UNAVAILABLE.rawValue:
                    /*
                     Push token is not available.
                     
                     Nothing, it's handled automatically by the sdk.
                     */
                    eventEmitter.sendEvent(withName: "Catapush#catapushHandleError", body: ["event" : "PUSH_TOKEN_UNAVAILABLE", "code": CatapushErrorCode.PUSH_TOKEN_UNAVAILABLE.rawValue])
                    break
                default:
                    break
                }
            }
        }
        
        func retry(delayInSeconds:Int) {
            let deadlineTime = DispatchTime.now() + .seconds(delayInSeconds)
            DispatchQueue.main.asyncAfter(deadline: deadlineTime) {
                var error: NSError?
                Catapush.start(&error)
                if error != nil {
                    // API KEY, USERNAME or PASSWORD not set
                }
            }
        }
    }
    
    class MessagesDispatchDelegateClass: NSObject, MessagesDispatchDelegate{
        let eventEmitter: RCTEventEmitter
        
        init(eventEmitter: RCTEventEmitter) {
            self.eventEmitter = eventEmitter
        }
        
        func libraryDidReceive(_ messageIP: MessageIP!) {
            eventEmitter.sendEvent(withName: "Catapush#catapushMessageReceived", body: ["message" : formatMessageID(message: messageIP)])
        }
    }
    
    public static func formatMessageID(message: MessageIP) -> Dictionary<String, Any?>{
        let formatter = ISO8601DateFormatter()
        
        return [
            "id": message.messageId,
            "body": message.body,
            "sender": message.sender,
            "channel": message.channel,
            "optionalData": message.optionalData(),
            "replyToId": message.originalMessageId,
            "state": getStateForMessage(message: message),
            "sentTime": formatter.string(from: message.sentTime),
            "hasAttachment": message.hasMedia()
        ]
    }
    
    public static func getStateForMessage(message: MessageIP) -> String{
        if message.type.intValue == MESSAGEIP_TYPE.MessageIP_TYPE_INCOMING.rawValue {
            if message.status.intValue == MESSAGEIP_STATUS.MessageIP_READ.rawValue{
                return "RECEIVED_CONFIRMED"
            }
            return "RECEIVED"
        }else{
            return "SENT"
        }
    }
}
