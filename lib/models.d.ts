export declare class CatapushMessage {
    id: string;
    sender: string;
    body?: string;
    subject?: string;
    previewText?: string;
    hasAttachment: boolean;
    channel?: string;
    replyToId?: string;
    optionalData?: Map<string, any>;
    receivedTime?: Date;
    readTime?: Date;
    sentTime?: Date;
    state: CatapushMessageState;
    constructor(id: string, sender: string, state: CatapushMessageState, hasAttachment: boolean, body?: string, subject?: string, previewText?: string, channel?: string, replyToId?: string, optionalData?: Map<string, any>, receivedTime?: Date, readTime?: Date, sentTime?: Date);
    toString: () => string;
}
export declare class CatapushFile {
    mimeType: string;
    url: string;
    constructor(mimeType: string, url: string);
    mapRepresentation(): {
        mimeType: string;
        url: string;
    };
    toString: () => string;
}
export declare enum CatapushMessageState {
    RECEIVED = "RECEIVED",
    RECEIVED_CONFIRMED = "RECEIVED_CONFIRMED",
    OPENED = "OPENED",
    OPENED_CONFIRMED = "OPENED_CONFIRMED",
    NOT_SENT = "NOT_SENT",
    SENT = "SENT",
    SENT_CONFIRMED = "SENT_CONFIRMED"
}
export interface CatapushMessageDelegate {
    catapushMessageReceived(message: CatapushMessage): void;
    catapushMessageSent(message: CatapushMessage): void;
    catapushNotificationTapped(message: CatapushMessage): void;
}
export declare enum CatapushState {
    DISCONNECTED = "DISCONNECTED",
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED"
}
export declare class CatapushError {
    event: string;
    code: number;
    constructor(event: string, code: number);
    toString: () => string;
}
export interface CatapushStateDelegate {
    catapushStateChanged(state: CatapushState): void;
    catapushHandleError(error: CatapushError): void;
}
