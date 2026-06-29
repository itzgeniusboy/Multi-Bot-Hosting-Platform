export interface Bot {
  id: string;
  username: string;
  token: string;
  vercelDomain: string;
  behavior: string;
  status: 'online' | 'offline';
  created_at: string;
  request_count: number;
  last_request_time?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  botId: string;
  botUsername: string;
  message: string;
  method: string;
  path: string;
  status_code: number;
  payload_received?: string;
}

export interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isMarkdown?: boolean;
}
