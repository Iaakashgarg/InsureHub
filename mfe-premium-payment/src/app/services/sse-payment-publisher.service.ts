import { Injectable } from '@angular/core';
import { SseProducer, SSE_STREAMS, SSE_EVENT_TYPES, IPayment } from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class SsePaymentPublisherService {
  private paymentProducer: SseProducer;
  private navigationProducer: SseProducer;

  constructor() {
    this.paymentProducer = new SseProducer(SSE_STREAMS.PAYMENT_EVENTS, 'mfe-premium-payment');
    this.navigationProducer = new SseProducer(SSE_STREAMS.NAVIGATION_EVENTS, 'mfe-premium-payment');
  }

  emitPaymentCompleted(payment: IPayment): void {
    this.paymentProducer.emit(SSE_EVENT_TYPES.PAYMENT_COMPLETED, payment);
  }

  emitPaymentFailed(error: { policyId: string; reason: string }): void {
    this.paymentProducer.emit(SSE_EVENT_TYPES.PAYMENT_FAILED, error);
  }

  emitNavigateToPolicies(): void {
    this.navigationProducer.emit(SSE_EVENT_TYPES.NAVIGATE_TO_POLICIES, {});
  }
}
