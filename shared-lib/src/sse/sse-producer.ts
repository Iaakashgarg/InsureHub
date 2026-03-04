import { ISseEvent } from "../models/sse-event.interface";

/**
 * SSE Producer — used by an MFE to publish events onto a named stream.
 * Each producer opens a BroadcastChannel to the broker's stream.
 */
export class SseProducer {
  private channel: BroadcastChannel;

  constructor(
    private streamName: string,
    private sourceName: string,
  ) {
    this.channel = new BroadcastChannel(`sse:${streamName}`);
  }

  /**
   * Emit an SSE event.
   */
  emit<T>(eventType: string, data: T): ISseEvent<T> {
    const event: ISseEvent<T> = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      timestamp: Date.now(),
      source: this.sourceName,
    };
    this.channel.postMessage(event);
    return event;
  }

  close(): void {
    this.channel.close();
  }
}
