import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SseConsumer, SSE_STREAMS, SSE_EVENT_TYPES, ISseEvent, IPolicy } from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class SseListenerService implements OnDestroy {
  private consumer: SseConsumer;
  private subscription: Subscription | null = null;

  private selectedPolicySubject = new BehaviorSubject<IPolicy | null>(null);
  selectedPolicy$ = this.selectedPolicySubject.asObservable();

  private navigateToPaymentSubject = new BehaviorSubject<string | null>(null);
  navigateToPayment$ = this.navigateToPaymentSubject.asObservable();

  constructor() {
    this.consumer = new SseConsumer(SSE_STREAMS.POLICY_EVENTS);
    this.startListening();
  }

  private startListening(): void {
    this.subscription = this.consumer.onMessage().subscribe({
      next: (event: ISseEvent) => {
        this.handleEvent(event);
      },
      error: (err: unknown) => {
        console.error('[MFE2 SSE Listener] Error:', err);
      },
    });
  }

  private handleEvent(event: ISseEvent): void {
    switch (event.type) {
      case SSE_EVENT_TYPES.POLICY_SELECTED:
        console.log('[MFE2] Policy selected event received:', event.data);
        this.selectedPolicySubject.next(event.data as IPolicy);
        break;

      case SSE_EVENT_TYPES.NAVIGATE_TO_PAYMENT:
        console.log('[MFE2] Navigate to payment event:', event.data);
        this.navigateToPaymentSubject.next((event.data as any)?.policyId || null);
        break;

      case SSE_EVENT_TYPES.PREMIUM_CALCULATED:
        console.log('[MFE2] Premium calculated event:', event.data);
        break;

      default:
        console.log('[MFE2] Unhandled event type:', event.type);
    }
  }

  clearSelectedPolicy(): void {
    this.selectedPolicySubject.next(null);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.consumer.close();
  }
}
