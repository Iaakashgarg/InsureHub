import { Injectable, OnDestroy } from '@angular/core';
import { SseProducer, SSE_STREAMS, SSE_EVENT_TYPES, IPolicy } from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class SsePublisherService implements OnDestroy {
  private policyProducer = new SseProducer(SSE_STREAMS.POLICY_EVENTS, 'mfe-policy-dashboard');
  private navProducer = new SseProducer(SSE_STREAMS.NAVIGATION_EVENTS, 'mfe-policy-dashboard');

  emitPolicySelected(policy: IPolicy): void {
    this.policyProducer.emit(SSE_EVENT_TYPES.POLICY_SELECTED, {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      premiumAmount: policy.premiumAmount,
      holderName: policy.holderName,
    });
  }

  emitNavigateToPayment(policyId: string): void {
    this.navProducer.emit(SSE_EVENT_TYPES.NAVIGATE_TO_PAYMENT, {
      route: policyId,
    });
  }

  emitPremiumCalculated(results: any): void {
    this.policyProducer.emit(SSE_EVENT_TYPES.PREMIUM_CALCULATED, results);
  }

  ngOnDestroy(): void {
    this.policyProducer.close();
    this.navProducer.close();
  }
}
