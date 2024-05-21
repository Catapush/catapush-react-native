export class CatapushMessage {
    constructor(id, sender, state, hasAttachment, body, subject, previewText, channel, replyToId, optionalData, receivedTime, readTime, sentTime) {
        this.toString = () => {
            return `CatapushMessage (id: ${this.id}, sender: ${this.sender}, body: ${this.body}, subject: ${this.subject}, previewText: ${this.previewText}, hasAttachment: ${this.hasAttachment}, channel: ${this.channel}, replyToId: ${this.replyToId}, optionalData: ${this.optionalData}, receivedTime: ${this.receivedTime}, readTime: ${this.readTime}, sentTime: ${this.sentTime}, state: ${this.state})`;
        };
        this.id = id;
        this.sender = sender;
        this.body = body;
        this.subject = subject;
        this.previewText = previewText;
        this.hasAttachment = hasAttachment;
        this.channel = channel;
        this.replyToId = replyToId;
        this.optionalData = optionalData;
        this.receivedTime = receivedTime;
        this.readTime = readTime;
        this.sentTime = sentTime;
        this.state = state;
    }
}
export class CatapushFile {
    //Future<ByteData> previewData;
    constructor(mimeType, url /*, previewData*/) {
        this.toString = () => {
            return `CatapushFile (mimeType: ${this.mimeType}, url: ${this.url})`;
        };
        this.mimeType = mimeType;
        this.url = url;
    }
    mapRepresentation() {
        return {
            mimeType: this.mimeType,
            url: this.url,
        };
    }
}
export var CatapushMessageState;
(function (CatapushMessageState) {
    CatapushMessageState["RECEIVED"] = "RECEIVED";
    CatapushMessageState["RECEIVED_CONFIRMED"] = "RECEIVED_CONFIRMED";
    CatapushMessageState["OPENED"] = "OPENED";
    CatapushMessageState["OPENED_CONFIRMED"] = "OPENED_CONFIRMED";
    CatapushMessageState["NOT_SENT"] = "NOT_SENT";
    CatapushMessageState["SENT"] = "SENT";
    CatapushMessageState["SENT_CONFIRMED"] = "SENT_CONFIRMED";
})(CatapushMessageState || (CatapushMessageState = {}));
export var CatapushState;
(function (CatapushState) {
    CatapushState["DISCONNECTED"] = "DISCONNECTED";
    CatapushState["CONNECTING"] = "CONNECTING";
    CatapushState["CONNECTED"] = "CONNECTED";
})(CatapushState || (CatapushState = {}));
export class CatapushError {
    constructor(event, code) {
        this.toString = () => {
            return `CatapushError (event: ${this.event}, code: ${this.code})`;
        };
        this.event = event;
        this.code = code;
    }
}
//# sourceMappingURL=models.js.map