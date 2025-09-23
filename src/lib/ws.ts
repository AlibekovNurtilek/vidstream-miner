export const BASE_WS = "ws://localhost:8000/ws"
export interface WebSocketProgress {
  dataset_id: number;
  task: string;
  progress: number;
}

export class DatasetWebSocket {
  private ws: WebSocket | null = null;
  private onProgress: (data: WebSocketProgress) => void;
  private datasetId: number;

  constructor(datasetId: number, onProgress: (data: WebSocketProgress) => void) {
    this.datasetId = datasetId;
    this.onProgress = onProgress;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(`${BASE_WS}/${this.datasetId}`);

    this.ws.onopen = () => {
      console.log(`WebSocket connected for dataset ${this.datasetId}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketProgress = JSON.parse(event.data);
        this.onProgress(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error(`WebSocket error for dataset ${this.datasetId}:`, error);
    };

    this.ws.onclose = () => {
      console.log(`WebSocket disconnected for dataset ${this.datasetId}`);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}