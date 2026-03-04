/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { policies } = data;

  const results = policies.map((policy: any) => {
    const basePremium = policy.premiumAmount;
    const riskMultiplier = calculateRiskMultiplier(policy.type, policy.coverageDetails || []);
    const projectedAnnualPremium = Math.round(basePremium * 12 * riskMultiplier);
    const nextDueDate = calculateNextDueDate(policy.startDate);
    const savings = calculatePotentialSavings(basePremium, riskMultiplier);

    return {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      basePremium,
      riskMultiplier: Math.round(riskMultiplier * 100) / 100,
      projectedAnnualPremium,
      nextDueDate,
      savings,
    };
  });

  postMessage({ type: 'CALCULATION_COMPLETE', results });
});

function calculateRiskMultiplier(type: string, coverages: any[]): number {
  const typeMultipliers: Record<string, number> = {
    life: 1.2,
    health: 1.5,
    vehicle: 1.8,
    home: 1.3,
  };
  const base = typeMultipliers[type] || 1.0;
  const coverageAdjustment = coverages.length * 0.05;
  return base + coverageAdjustment;
}

function calculateNextDueDate(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(start);
  while (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().split('T')[0];
}

function calculatePotentialSavings(basePremium: number, riskMultiplier: number): number {
  return Math.round(basePremium * (riskMultiplier - 1) * 0.15 * 100) / 100;
}
