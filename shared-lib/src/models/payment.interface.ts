export interface IPayment {
  id?: string;
  paymentId: string;
  policyId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "credit_card" | "debit_card" | "net_banking" | "upi";
  status: "completed" | "failed" | "pending";
  receiptNumber: string;
  transactionRef?: string;
}
