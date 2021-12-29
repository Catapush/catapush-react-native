export class CatapushMessage {
  id: string
  sender: string
  body?: string
  subject?: string // non esposto su iOS ma presente in core data
  previewText?: string // no iOS
  hasAttachment: boolean
  channel?: string
  replyToId?: string // originalMessageId
  optionalData?: Map<string, any> //verificare se le API limitano a 1 livello chiave valore String:String
  receivedTime?: Date // no iOS
  readTime?: Date // iOS lo gestisce in una tabella diversa e quindi valutare la join
  sentTime?: Date
  state: CatapushMessageState

  constructor(
    id: string,
    sender: string,
    state: CatapushMessageState,
    hasAttachment: boolean,
    body?: string,
    subject?: string,
    previewText?: string,
    channel?: string,
    replyToId?: string,
    optionalData?: Map<string, any>,
    receivedTime?: Date,
    readTime?: Date,
    sentTime?: Date
  ) {
    this.id = id
    this.sender = sender
    this.body = body
    this.subject = subject
    this.previewText = previewText
    this.hasAttachment = hasAttachment
    this.channel = channel
    this.replyToId = replyToId
    this.optionalData = optionalData
    this.receivedTime = receivedTime
    this.readTime = readTime
    this.sentTime = sentTime
    this.state = state
  }

  public toString = (): string => {
    return `CatapushMessage (id: ${this.id}, sender: ${this.sender}, body: ${this.body}, subject: ${this.subject}, previewText: ${this.previewText}, hasAttachment: ${this.hasAttachment}, channel: ${this.channel}, replyToId: ${this.replyToId}, optionalData: ${this.optionalData}, receivedTime: ${this.receivedTime}, readTime: ${this.readTime}, sentTime: ${this.sentTime}, state: ${this.state})`
  }
}

export class CatapushFile {
  mimeType: string
  url: string
  //Future<ByteData> previewData;

  constructor(mimeType: string, url: string /*, previewData*/) {
    this.mimeType = mimeType
    this.url = url
  }

  public mapRepresentation() {
    return {
      mimeType: this.mimeType,
      url: this.url,
    }
  }

  public toString = (): string => {
    return `CatapushFile (mimeType: ${this.mimeType}, url: ${this.url})`
  }
}

export enum CatapushMessageState {
  RECEIVED = 'RECEIVED',
  RECEIVED_CONFIRMED = 'RECEIVED_CONFIRMED',
  OPENED = 'OPENED',
  OPENED_CONFIRMED = 'OPENED_CONFIRMED',
  NOT_SENT = 'NOT_SENT',
  SENT = 'SENT',
  SENT_CONFIRMED = 'SENT_CONFIRMED',
}

export interface CatapushMessageDelegate {
  catapushMessageReceived(message: CatapushMessage): void
  catapushMessageSent(message: CatapushMessage): void
}

export enum CatapushState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export class CatapushError {
  event: string
  code: number

  constructor(event: string, code: number) {
    this.event = event
    this.code = code
  }

  public toString = (): string => {
    return `CatapushError (event: ${this.event}, code: ${this.code})`
  }
}

export interface CatapushStateDelegate {
  catapushStateChanged(state: CatapushState): void
  catapushHandleError(error: CatapushError): void
}
