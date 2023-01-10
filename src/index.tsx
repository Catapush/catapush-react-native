import { NativeModules } from 'react-native';

import EventManager, {
  CATAPUSH_HANDLE_ERROR,
  CATAPUSH_MESSAGE_RECEIVED,
  CATAPUSH_MESSAGE_SENT,
  CATAPUSH_NOTIFICATION_TAPPED,
  CATAPUSH_STATE_CHANGED,
} from './events';
import {
  CatapushError,
  CatapushFile,
  CatapushMessage,
  CatapushMessageDelegate,
  CatapushStateDelegate,
} from './models';

function objectToCatapushMessage(message: any): CatapushMessage {
  return new CatapushMessage(
    message.id,
    message.sender,
    message.state,
    message.hasAttachment,
    message.body,
    message.subject,
    message.previewText,
    message.channel,
    message.replyToId,
    message.optionalData,
    new Date(message.receivedTime),
    new Date(message.readTime),
    new Date(message.sentTime),
  );
}

function catapushMessageToObject(message: CatapushMessage): object {
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

interface CatapushPluginModuleInterface {
  init(appId: string): Promise<boolean>;
  setUser(identifier: string, password: string): Promise<boolean>;
  start(): Promise<boolean>;
  sendMessage(message: object): Promise<boolean>;
  allMessages(): Promise<object[]>;
  enableLog(enabled: boolean): Promise<boolean>;
  logout(): Promise<boolean>;
  sendMessageReadNotificationWithId(id: string): Promise<boolean>;
  getAttachmentUrlForMessage(message: object): Promise<CatapushFile>;
  resumeNotifications(): Promise<void>;
  pauseNotifications(): Promise<void>;
  enableNotifications(): Promise<void>;
  disableNotifications(): Promise<void>;
}

const catapushPluginModule =
  NativeModules.CatapushPluginModule as CatapushPluginModuleInterface;

const eventManager = new EventManager();

export default class Catapush {
  private static messageDelegate?: CatapushMessageDelegate;
  private static stateDelegate?: CatapushStateDelegate;

  static init(appId: string): Promise<boolean> {
    eventManager.setEventHandler(CATAPUSH_MESSAGE_RECEIVED, (payload: any) => {
      console.log('CATAPUSH MESSAGE RECEIVED ' + payload.message.id);
      this.messageDelegate?.catapushMessageReceived(
        objectToCatapushMessage(payload.message),
      );
    });
    eventManager.setEventHandler(CATAPUSH_MESSAGE_SENT, (payload: any) => {
      console.log('CATAPUSH MESSAGE SENT ' + payload.message.id);
      this.messageDelegate?.catapushMessageSent(
        objectToCatapushMessage(payload.message),
      );
    });
    eventManager.setEventHandler(CATAPUSH_NOTIFICATION_TAPPED, (payload: any) => {
      console.log('CATAPUSH NOTIFICATION TAPPED ' + payload.message.id);
      this.messageDelegate?.catapushNotificationTapped(
        objectToCatapushMessage(payload.message),
      );
    });
    eventManager.setEventHandler(CATAPUSH_STATE_CHANGED, (payload: any) => {
      console.log('CATAPUSH STATE ' + payload.status);
      this.stateDelegate?.catapushStateChanged(payload.status);
    });
    eventManager.setEventHandler(CATAPUSH_HANDLE_ERROR, (payload: any) => {
      console.log('CATAPUSH ERROR ' + payload.event + ' ' + payload.code);
      this.stateDelegate?.catapushHandleError(
        new CatapushError(payload.event, payload.code),
      );
    });
    return catapushPluginModule.init(appId);
  }
  static setUser(identifier: string, password: string): Promise<boolean> {
    return catapushPluginModule.setUser(identifier, password);
  }
  static start(): Promise<boolean> {
    return catapushPluginModule.start();
  }
  static sendMessage(
    body: string,
    channel: string | null,
    replyTo: string | null,
    file: CatapushFile | null,
  ): Promise<boolean> {
    let fileMap = file?.mapRepresentation();
    return catapushPluginModule.sendMessage({
      body: body,
      channel: channel,
      replyTo: replyTo,
      file: fileMap,
    });
  }
  static allMessages(): Promise<CatapushMessage[]> {
    return catapushPluginModule.allMessages().then(messages => {
      return messages.map(message => objectToCatapushMessage(message));
    });
  }
  static enableLog(enabled: boolean): Promise<boolean> {
    return catapushPluginModule.enableLog(enabled);
  }
  static logout(): Promise<boolean> {
    return catapushPluginModule.logout();
  }
  static sendMessageReadNotificationWithId(id: string): Promise<boolean> {
    return catapushPluginModule.sendMessageReadNotificationWithId(id);
  }
  static setCatapushMessageDelegate(delegate: CatapushMessageDelegate): void {
    Catapush.messageDelegate = delegate;
  }
  static setCatapushStateDelegate(delegate: CatapushStateDelegate): void {
    Catapush.stateDelegate = delegate;
  }
  static getAttachmentUrlForMessage(
    message: CatapushMessage,
  ): Promise<CatapushFile> {
    return catapushPluginModule.getAttachmentUrlForMessage(
      catapushMessageToObject(message),
    );
  }
  static resumeNotifications(): Promise<void> {
    return catapushPluginModule.resumeNotifications();
  }
  static pauseNotifications(): Promise<void> {
    return catapushPluginModule.pauseNotifications();
  }
  static enableNotifications(): Promise<void> {
    return catapushPluginModule.enableNotifications();
  }
  static disableNotifications(): Promise<void> {
    return catapushPluginModule.disableNotifications();
  }
  static clearHandlers(): void {
    eventManager.clearHandlers();
  }
}
export {
  CatapushError,
  CatapushFile,
  CatapushMessage,
  CatapushMessageDelegate,
  CatapushMessageState,
  CatapushState,
  CatapushStateDelegate,
} from './models';
export { CatapushMessageWidget } from './widgets';
