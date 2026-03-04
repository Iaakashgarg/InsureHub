import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Inline worker source code.
 * Using a Blob-based worker avoids the cross-origin SecurityError that occurs
 * when MFE1 is loaded inside the container shell on a different port.
 */
const WORKER_SOURCE = `
  self.addEventListener('message', function(e) {
    var policies = e.data.policies;

    var typeMultipliers = { life: 1.2, health: 1.5, vehicle: 1.8, home: 1.3 };

    function calculateRiskMultiplier(type, coverages) {
      var base = typeMultipliers[type] || 1.0;
      var coverageAdjustment = (coverages ? coverages.length : 0) * 0.05;
      return base + coverageAdjustment;
    }

    function calculateNextDueDate(startDate) {
      var start = new Date(startDate);
      var now = new Date();
      var next = new Date(start);
      while (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next.toISOString().split('T')[0];
    }

    function calculatePotentialSavings(basePremium, riskMultiplier) {
      return Math.round(basePremium * (riskMultiplier - 1) * 0.15 * 100) / 100;
    }

    var results = policies.map(function(policy) {
      var basePremium = policy.premiumAmount;
      var riskMultiplier = calculateRiskMultiplier(policy.type, policy.coverageDetails || []);
      var projectedAnnualPremium = Math.round(basePremium * 12 * riskMultiplier);
      var nextDueDate = calculateNextDueDate(policy.startDate);
      var savings = calculatePotentialSavings(basePremium, riskMultiplier);

      return {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        basePremium: basePremium,
        riskMultiplier: Math.round(riskMultiplier * 100) / 100,
        projectedAnnualPremium: projectedAnnualPremium,
        nextDueDate: nextDueDate,
        savings: savings
      };
    });

    self.postMessage({ type: 'CALCULATION_COMPLETE', results: results });
  });
`;

@Injectable({ providedIn: 'root' })
export class PremiumWorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private results$ = new Subject<any>();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker === 'undefined') {
      return;
    }
    try {
      const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      URL.revokeObjectURL(url);

      this.worker.onmessage = ({ data }) => {
        this.results$.next(data);
      };
      this.worker.onerror = (error) => {
        console.error('Web Worker error:', error);
        this.fallbackCalculation();
      };
    } catch (e) {
      console.warn('Web Worker creation failed, using main-thread fallback:', e);
    }
  }

  calculatePremiums(policies: any[]): Observable<any> {
    if (this.worker) {
      this.worker.postMessage({ policies });
    } else {
      // Main-thread fallback
      this.fallbackCalculation(policies);
    }
    return this.results$.asObservable();
  }

  private fallbackCalculation(policies?: any[]): void {
    if (!policies) return;
    const typeMultipliers: Record<string, number> = {
      life: 1.2,
      health: 1.5,
      vehicle: 1.8,
      home: 1.3,
    };
    const results = policies.map((policy) => {
      const base = typeMultipliers[policy.type] || 1.0;
      const adj = (policy.coverageDetails?.length || 0) * 0.05;
      const rm = base + adj;
      return {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        basePremium: policy.premiumAmount,
        riskMultiplier: Math.round(rm * 100) / 100,
        projectedAnnualPremium: Math.round(policy.premiumAmount * 12 * rm),
        nextDueDate: new Date().toISOString().split('T')[0],
        savings: Math.round(policy.premiumAmount * (rm - 1) * 0.15 * 100) / 100,
      };
    });
    this.results$.next({ type: 'CALCULATION_COMPLETE', results });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
    this.results$.complete();
  }
}
