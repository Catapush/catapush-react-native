export class CatapushMessage {
    id;
    sender;
    body;
    subject; // non esposto su iOS ma presente in core data
    previewText; // no iOS
    hasAttachment;
    channel;
    replyToId; // originalMessageId
    optionalData; //verificare se le API limitano a 1 livello chiave valore String:String
    receivedTime; // no iOS
    readTime; // iOS lo gestisce in una tabella diversa e quindi valutare la join
    sentTime;
    state;
    constructor(id, sender, state, hasAttachment, body, subject, previewText, channel, replyToId, optionalData, receivedTime, readTime, sentTime) {
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
    toString = () => {
        return `CatapushMessage (id: ${this.id}, sender: ${this.sender}, body: ${this.body}, subject: ${this.subject}, previewText: ${this.previewText}, hasAttachment: ${this.hasAttachment}, channel: ${this.channel}, replyToId: ${this.replyToId}, optionalData: ${this.optionalData}, receivedTime: ${this.receivedTime}, readTime: ${this.readTime}, sentTime: ${this.sentTime}, state: ${this.state})`;
    };
}
export class CatapushFile {
    mimeType;
    url;
    //Future<ByteData> previewData;
    constructor(mimeType, url /*, previewData*/) {
        this.mimeType = mimeType;
        this.url = url;
    }
    mapRepresentation() {
        return {
            mimeType: this.mimeType,
            url: this.url,
        };
    }
    toString = () => {
        return `CatapushFile (mimeType: ${this.mimeType}, url: ${this.url})`;
    };
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
    event;
    code;
    constructor(event, code) {
        this.event = event;
        this.code = code;
    }
    toString = () => {
        return `CatapushError (event: ${this.event}, code: ${this.code})`;
    };
}
//# sourceMappingURL=models.js.map