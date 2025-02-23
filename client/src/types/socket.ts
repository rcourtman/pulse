export interface ServerToClientEvents {
  pong: (data: { time: string }) => void;
}

export interface ClientToServerEvents {
  ping: () => void;
} 