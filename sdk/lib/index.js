import { NativeModules } from 'react-native';
import EventManager, { CATAPUSH_HANDLE_ERROR, CATAPUSH_MESSAGE_RECEIVED, CATAPUSH_MESSAGE_SENT, CATAPUSH_NOTIFICATION_TAPPED, CATAPUSH_STATE_CHANGED, } from './events';
import { CatapushError, CatapushMessage, } from './models';
function objectToCatapushMessage(message) {
    return new CatapushMessage(message.id, message.sender, message.state, message.hasAttachment, message.body, message.subject, message.previewText, message.channel, message.replyToId, message.optionalData, new Date(message.receivedTime), new Date(message.readTime), new Date(message.sentTime));
}
function catapushMessageToObject(message) {
    return {
        id: message.id,
        sender: message.sender,
        state: message.state,
        hasAttachment: message.hasAttachment,
        body: message.body,
        subject: message.subject,
        previewText: message.previewText,
        channel: message.channel,
        replyToId: message.replyToId,
        optionalData: message.optionalData,
        receivedTime: message.receivedTime,
        readTime: message.readTime,
        sentTime: message.sentTime,
    };
}
const catapushPluginModule = NativeModules.CatapushPluginModule;
const eventManager = new EventManager();
export default class Catapush {
    static messageDelegate;
    static stateDelegate;
    static init(appId) {
        eventManager.setEventHandler(CATAPUSH_MESSAGE_RECEIVED, (payload) => {
            console.log('CATAPUSH MESSAGE RECEIVED ' + payload.message.id);
            this.messageDelegate?.catapushMessageReceived(objectToCatapushMessage(payload.message));
        });
        eventManager.setEventHandler(CATAPUSH_MESSAGE_SENT, (payload) => {
            console.log('CATAPUSH MESSAGE SENT ' + payload.message.id);
            this.messageDelegate?.catapushMessageSent(objectToCatapushMessage(payload.message));
        });
        eventManager.setEventHandler(CATAPUSH_NOTIFICATION_TAPPED, (payload) => {
            console.log('CATAPUSH NOTIFICATION TAPPED ' + payload.message.id);
            this.messageDelegate?.catapushNotificationTapped(objectToCatapushMessage(payload.message));
        });
        eventManager.setEventHandler(CATAPUSH_STATE_CHANGED, (payload) => {
            console.log('CATAPUSH STATE ' + payload.status);
            this.stateDelegate?.catapushStateChanged(payload.status);
        });
        eventManager.setEventHandler(CATAPUSH_HANDLE_ERROR, (payload) => {
            console.log('CATAPUSH ERROR ' + payload.event + ' ' + payload.code);
            this.stateDelegate?.catapushHandleError(new CatapushError(payload.event, payload.code));
        });
        return catapushPluginModule.init(appId);
    }
    static setUser(identifier, password) {
        return catapushPluginModule.setUser(identifier, password);
    }
    static start() {
        return catapushPluginModule.start();
    }
    static sendMessage(body, channel, replyTo, file) {
        let fileMap = file?.mapRepresentation();
        return catapushPluginModule.sendMessage({
            body: body,
            channel: channel,
            replyTo: replyTo,
            file: fileMap,
        });
    }
    static allMessages() {
        return catapushPluginModule.allMessages().then(messages => {
            return messages.map(message => objectToCatapushMessage(message));
        });
    }
    static enableLog(enabled) {
        return catapushPluginModule.enableLog(enabled);
    }
    static logout() {
        return catapushPluginModule.logout();
    }
    static sendMessageReadNotificationWithId(id) {
        return catapushPluginModule.sendMessageReadNotificationWithId(id);
    }
    static setCatapushMessageDelegate(delegate) {
        Catapush.messageDelegate = delegate;
    }
    static setCatapushStateDelegate(delegate) {
        Catapush.stateDelegate = delegate;
    }
    static getAttachmentUrlForMessage(message) {
        return catapushPluginModule.getAttachmentUrlForMessage(catapushMessageToObject(message));
    }
    static resumeNotifications() {
        return catapushPluginModule.resumeNotifications();
    }
    static pauseNotifications() {
        return catapushPluginModule.pauseNotifications();
    }
    static enableNotifications() {
        return catapushPluginModule.enableNotifications();
    }
    static disableNotifications() {
        return catapushPluginModule.disableNotifications();
    }
    static clearHandlers() {
        eventManager.clearHandlers();
    }
}
export { CatapushError, CatapushFile, CatapushMessage, CatapushMessageState, CatapushState, } from './models';
export { CatapushMessageWidget } from './widgets';
//# sourceMappingURL=index.js.map