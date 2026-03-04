import { Injectable } from '@angular/core';
import { StorageAdapter } from 'shared-lib';
import { IPayment, IPolicy } from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly PAYMENTS_KEY = 'payments';
  private readonly POLICIES_KEY = 'policies';

  getAllPayments(): IPayment[] {
    return StorageAdapter.get<IPayment[]>(this.PAYMENTS_KEY) || [];
  }

  getPaymentsByPolicyId(policyId: string): IPayment[] {
    return this.getAllPayments().filter((p) => p.policyId === policyId);
  }

  getPaymentById(paymentId: string): IPayment | undefined {
    return this.getAllPayments().find((p) => p.paymentId === paymentId);
  }

  getPolicyById(policyId: string): IPolicy | undefined {
    const policies = StorageAdapter.get<IPolicy[]>(this.POLICIES_KEY) || [];
    return policies.find((p) => p.policyId === policyId);
  }

  processPayment(payment: Omit<IPayment, 'paymentId' | 'paymentDate' | 'receiptNumber'>): IPayment {
    const payments = this.getAllPayments();

    const newPayment: IPayment = {
      ...payment,
      paymentId: `PAY-${Date.now()}`,
      paymentDate: new Date().toISOString(),
      receiptNumber: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    payments.push(newPayment);
    StorageAdapter.set(this.PAYMENTS_KEY, payments);

    // Update policy nextDueDate
    this.updatePolicyNextDueDate(payment.policyId);

    return newPayment;
  }

  private updatePolicyNextDueDate(policyId: string): void {
    const policies = StorageAdapter.get<IPolicy[]>(this.POLICIES_KEY) || [];
    const policyIndex = policies.findIndex((p) => p.policyId === policyId);

    if (policyIndex !== -1) {
      const policy = policies[policyIndex];
      const currentDue = new Date(policy.nextDueDate);
      currentDue.setMonth(currentDue.getMonth() + 1);
      policies[policyIndex] = {
        ...policy,
        nextDueDate: currentDue.toISOString(),
        status: 'active',
      };
      StorageAdapter.set(this.POLICIES_KEY, policies);
    }
  }

  getTotalPaidAmount(): number {
    return this.getAllPayments()
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getPendingPayments(): IPayment[] {
    return this.getAllPayments().filter((p) => p.status === 'pending');
  }
}
