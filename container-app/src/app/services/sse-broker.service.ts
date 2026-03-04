import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SseBroker, SseConsumer, SSE_STREAMS, SSE_EVENT_TYPES, ISseEvent } from 'shared-lib';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SseBrokerService implements OnDestroy {
  private broker = new SseBroker();
  private navConsumer: SseConsumer;
  private subscriptions = new Subscription();

  constructor(private router: Router) {
    this.navConsumer = new SseConsumer(SSE_STREAMS.NAVIGATION_EVENTS);

    this.subscriptions.add(
      this.navConsumer
        .on<{ route: string }>(SSE_EVENT_TYPES.NAVIGATE_TO_PAYMENT)
        .subscribe((event: ISseEvent<{ route: string }>) => {
          this.router.navigate(['/payments'], {
            queryParams: { policyId: event.data.route },
          });
        }),
    );

    this.subscriptions.add(
      this.navConsumer
        .on<Record<string, never>>(SSE_EVENT_TYPES.NAVIGATE_TO_POLICIES)
        .subscribe((_event: ISseEvent<Record<string, never>>) => {
          this.router.navigate(['/policies']);
        }),
    );
  }

  getBroker(): SseBroker {
    return this.broker;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.navConsumer.close();
    this.broker.destroy();
  }
}
