import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { ISseEvent } from "../models/sse-event.interface";

/**
 * SSE Consumer — subscribes to a named stream and delivers events
 * as an Observable (EventSource-like API).
 *
 * Supports:
 * - Filtering by event type
 * - Last-Event-ID tracking
 * - Auto-reconnect (re-subscribe to BroadcastChannel)
 */
export class SseConsumer {
  private channel!: BroadcastChannel;
  private events$ = new Subject<ISseEvent>();
  private lastEventId: string | null = null;
  private retryMs = 3000;

  constructor(private streamName: string) {
    this.connect();
  }

  private connect(): void {
    this.channel = new BroadcastChannel(`sse:${this.streamName}`);
    this.channel.onmessage = (msg: MessageEvent<ISseEvent>) => {
      this.lastEventId = msg.data.id;
      this.events$.next(msg.data);
    };
    this.channel.onmessageerror = () => {
      this.channel.close();
      setTimeout(() => this.connect(), this.retryMs);
    };
  }

  /**
   * Get all events on this stream.
   */
  onMessage(): Observable<ISseEvent> {
    return this.events$.asObservable();
  }

  /**
   * Get events filtered by event type.
   */
  on<T>(eventType: string): Observable<ISseEvent<T>> {
    return this.events$.pipe(
      filter((e: ISseEvent) => e.type === eventType),
    ) as Observable<ISseEvent<T>>;
  }

  /**
   * Get last received event ID (SSE Last-Event-ID).
   */
  getLastEventId(): string | null {
    return this.lastEventId;
  }

  close(): void {
    this.channel.close();
    this.events$.complete();
  }
}
