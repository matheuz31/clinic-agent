export interface IncomingMessage {
  from: string;
  text: string;
  channel: 'web' | 'whatsapp' | 'email';
}

export interface OutgoingMessage {
  to: string;
  text: string;
}

