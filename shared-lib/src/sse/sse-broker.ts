import { ISseEvent } from "../models/sse-event.interface";

/**
 * In-browser SSE Broker using BroadcastChannel.
 * The Container App creates and manages the broker.
 * MFEs connect as producers (publish) or consumers (subscribe).
 *
 * SSE Semantics preserved:
 * - Unidirectional push (producer → consumer)
 * - Event types for filtering
 * - Event IDs for ordering
 * - Retry/reconnect logic
 */
export class SseBroker {
  private channels = new Map<string, BroadcastChannel>();
  private eventLog = new Map<string, ISseEvent[]>();

  /**
   * Create or get a named SSE stream (channel).
   */
  getChannel(streamName: string): BroadcastChannel {
    if (!this.channels.has(streamName)) {
      const channel = new BroadcastChannel(`sse:${streamName}`);
      this.channels.set(streamName, channel);
      this.eventLog.set(streamName, []);
    }
    return this.channels.get(streamName)!;
  }

  /**
   * Publish an SSE event to a stream.
   */
  publish<T>(streamName: string, event: ISseEvent<T>): void {
    const channel = this.getChannel(streamName);
    const log = this.eventLog.get(streamName)!;
    log.push(event);
    if (log.length > 100) log.shift();
    channel.postMessage(event);
  }

  /**
   * Get events after a given ID (for reconnect/replay — SSE Last-Event-ID).
   */
  getEventsSince(streamName: string, lastEventId: string): ISseEvent[] {
    const log = this.eventLog.get(streamName) || [];
    const idx = log.findIndex((e) => e.id === lastEventId);
    return idx >= 0 ? log.slice(idx + 1) : [];
  }

  /**
   * Destroy all channels.
   */
  destroy(): void {
    this.channels.forEach((ch) => ch.close());
    this.channels.clear();
    this.eventLog.clear();
  }
}
