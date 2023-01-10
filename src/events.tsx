import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native'

export const CATAPUSH_MESSAGE_RECEIVED = 'Catapush#catapushMessageReceived'
export const CATAPUSH_MESSAGE_SENT = 'Catapush#catapushMessageSent'
export const CATAPUSH_NOTIFICATION_TAPPED = 'Catapush#catapushNotificationTapped'
export const CATAPUSH_STATE_CHANGED = 'Catapush#catapushStateChanged'
export const CATAPUSH_HANDLE_ERROR = 'Catapush#catapushHandleError'

const eventList = [
  CATAPUSH_MESSAGE_RECEIVED,
  CATAPUSH_MESSAGE_SENT,
  CATAPUSH_NOTIFICATION_TAPPED,
  CATAPUSH_STATE_CHANGED,
  CATAPUSH_HANDLE_ERROR,
]

export default class EventManager {
  catapushEventEmitter: NativeEventEmitter
  notificationCache: Map<any, any>
  eventHandlerMap: Map<any, any>
  eventHandlerArrayMap: Map<any, any>
  listeners: Map<string, EmitterSubscription>

  constructor() {
    this.notificationCache = new Map()
    this.catapushEventEmitter = new NativeEventEmitter(
      NativeModules.CatapushPluginModule
    )
    this.eventHandlerMap = new Map()
    this.eventHandlerArrayMap = new Map()
    this.listeners = new Map()
    this.setupListeners()
  }

  setupListeners() {
    // set up the event emitter and listeners
    for (let i = 0; i < eventList.length; i++) {
      let eventName = eventList[i]
      this.listeners.set(eventName, this.generateEventListener(eventName))
    }
  }

  // clear handlers
  clearHandlers() {
    this.eventHandlerMap = new Map()
    this.eventHandlerArrayMap = new Map()
  }

  /**
   * Sets the event handler on the JS side of the bridge
   * Supports only one handler at a time
   * @param  {string} eventName
   * @param  {function} handler
   */
  setEventHandler(eventName: string, handler: any) {
    this.eventHandlerMap.set(eventName, handler)
  }

  /**
   * clears the event handler(s) for the event name
   * @param  {string} eventName
   * @param  {function} handler
   */
  clearEventHandler(eventName: string) {
    this.eventHandlerArrayMap.delete(eventName)
  }

  // returns an event listener with the js to native mapping
  generateEventListener(eventName: string) {
    const addListenerCallback = (payload: any) => {
      let handler = this.eventHandlerMap.get(eventName)
      // Check if we have added listener for this type yet
      if (handler) {
        handler(payload)
      }
    }

    return this.catapushEventEmitter.addListener(eventName, addListenerCallback)
  }
}
