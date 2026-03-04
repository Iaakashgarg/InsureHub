export interface IPolicy {
  id: string;
  policyId: string;
  policyNumber: string;
  holderName: string;
  type: "life" | "health" | "vehicle" | "home";
  premiumAmount: number;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  status: "active" | "expired" | "pending";
  coverageDetails: ICoverage[];
}

export interface ICoverage {
  type: string;
  limit: number;
  deductible: number;
  description: string;
}
