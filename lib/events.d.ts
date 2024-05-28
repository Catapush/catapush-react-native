import { EmitterSubscription, NativeEventEmitter } from 'react-native';
export declare const CATAPUSH_MESSAGE_RECEIVED = "Catapush#catapushMessageReceived";
export declare const CATAPUSH_MESSAGE_SENT = "Catapush#catapushMessageSent";
export declare const CATAPUSH_NOTIFICATION_TAPPED = "Catapush#catapushNotificationTapped";
export declare const CATAPUSH_STATE_CHANGED = "Catapush#catapushStateChanged";
export declare const CATAPUSH_HANDLE_ERROR = "Catapush#catapushHandleError";
export default class EventManager {
    catapushEventEmitter: NativeEventEmitter;
    notificationCache: Map<any, any>;
    eventHandlerMap: Map<any, any>;
    eventHandlerArrayMap: Map<any, any>;
    listeners: Map<string, EmitterSubscription>;
    constructor();
    setupListeners(): void;
    clearHandlers(): void;
    /**
     * Sets the event handler on the JS side of the bridge
     * Supports only one handler at a time
     * @param  {string} eventName
     * @param  {function} handler
     */
    setEventHandler(eventName: string, handler: any): void;
    /**
     * clears the event handler(s) for the event name
     * @param  {string} eventName
     */
    clearEventHandler(eventName: string): void;
    generateEventListener(eventName: string): EmitterSubscription;
}
