import { CatapushFile, CatapushMessage, CatapushMessageDelegate, CatapushStateDelegate } from './models';
export default class Catapush {
    private static messageDelegate?;
    private static stateDelegate?;
    static init(appId: string): Promise<boolean>;
    static setUser(identifier: string, password: string): Promise<boolean>;
    static start(): Promise<boolean>;
    static sendMessage(body: string, channel: string | null, replyTo: string | null, file: CatapushFile | null): Promise<boolean>;
    static allMessages(): Promise<CatapushMessage[]>;
    static enableLog(enabled: boolean): Promise<boolean>;
    static logout(): Promise<boolean>;
    static sendMessageReadNotificationWithId(id: string): Promise<boolean>;
    static setCatapushMessageDelegate(delegate: CatapushMessageDelegate): void;
    static setCatapushStateDelegate(delegate: CatapushStateDelegate): void;
    static getAttachmentUrlForMessage(message: CatapushMessage): Promise<CatapushFile>;
    static resumeNotifications(): Promise<void>;
    static pauseNotifications(): Promise<void>;
    static enableNotifications(): Promise<void>;
    static disableNotifications(): Promise<void>;
    static clearHandlers(): void;
}
export type { CatapushMessageDelegate, CatapushStateDelegate } from './models';
export { CatapushError, CatapushFile, CatapushMessage, CatapushMessageState, CatapushState, } from './models';
export { CatapushMessageWidget } from './widgets';
