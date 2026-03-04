import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';

import { IPolicy, IPayment } from 'shared-lib';
import { PaymentService } from '../../services/payment.service';
import { SseListenerService } from '../../services/sse-listener.service';
import { SsePaymentPublisherService } from '../../services/sse-payment-publisher.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentForm implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  policySelectionForm!: FormGroup;
  paymentDetailsForm!: FormGroup;

  policies: IPolicy[] = [];
  selectedPolicy: IPolicy | null = null;
  isProcessing = false;
  paymentComplete = false;
  lastPayment: IPayment | null = null;
  showReceipt = false;

  private subscriptions = new Subscription();

  paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', icon: 'credit_card' },
    { value: 'debit_card', label: 'Debit Card', icon: 'payment' },
    { value: 'net_banking', label: 'Net Banking', icon: 'account_balance' },
    { value: 'upi', label: 'UPI', icon: 'smartphone' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private sseListener: SseListenerService,
    private ssePublisher: SsePaymentPublisherService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadPolicies();
    this.listenForSseEvents();
    this.checkQueryParams();
  }

  private initForms(): void {
    this.policySelectionForm = this.fb.group({
      policyId: ['', Validators.required],
    });

    this.paymentDetailsForm = this.fb.group({
      paymentMethod: ['credit_card', Validators.required],
      amount: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
      upiId: [''],
      netBankingId: [''],
      remarks: ['', [Validators.maxLength(250)]],
    });

    // Switch validators dynamically when payment method changes
    this.paymentDetailsForm.get('paymentMethod')!.valueChanges.subscribe((method) => {
      this.updatePaymentFieldValidators(method);
    });
  }

  private updatePaymentFieldValidators(method: string): void {
    const cardNumber = this.paymentDetailsForm.get('cardNumber')!;
    const cardExpiry = this.paymentDetailsForm.get('cardExpiry')!;
    const cardCvv = this.paymentDetailsForm.get('cardCvv')!;
    const upiId = this.paymentDetailsForm.get('upiId')!;
    const netBankingId = this.paymentDetailsForm.get('netBankingId')!;

    // Clear all first
    cardNumber.clearValidators();
    cardExpiry.clearValidators();
    cardCvv.clearValidators();
    upiId.clearValidators();
    netBankingId.clearValidators();

    if (method === 'credit_card' || method === 'debit_card') {
      cardNumber.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      cardExpiry.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/),
      ]);
      cardCvv.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
    } else if (method === 'upi') {
      upiId.setValidators([Validators.required, Validators.pattern(/^[\w.\-]+@[\w]+$/)]);
    } else if (method === 'net_banking') {
      netBankingId.setValidators([Validators.required, Validators.minLength(3)]);
    }

    cardNumber.updateValueAndValidity();
    cardExpiry.updateValueAndValidity();
    cardCvv.updateValueAndValidity();
    upiId.updateValueAndValidity();
    netBankingId.updateValueAndValidity();
  }

  private loadPolicies(): void {
    const allPolicies = this.paymentService.getAllPayments();
    // Get policies from storage directly
    const policiesRaw = localStorage.getItem('policies');
    if (policiesRaw) {
      this.policies = (JSON.parse(policiesRaw) as IPolicy[]).filter(
        (p) => p.status === 'active' || p.status === 'pending',
      );
    }
  }

  private listenForSseEvents(): void {
    // Listen for policy selected from MFE1
    this.subscriptions.add(
      this.sseListener.selectedPolicy$.subscribe((policy) => {
        if (policy) {
          this.autoSelectPolicy(policy);
        }
      }),
    );

    // Listen for navigate-to-payment with policyId
    this.subscriptions.add(
      this.sseListener.navigateToPayment$.subscribe((policyId) => {
        if (policyId) {
          const policy = this.paymentService.getPolicyById(policyId);
          if (policy) {
            this.autoSelectPolicy(policy);
          }
        }
      }),
    );
  }

  private checkQueryParams(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        if (params['policyId']) {
          const policy = this.paymentService.getPolicyById(params['policyId']);
          if (policy) {
            this.autoSelectPolicy(policy);
          }
        }
      }),
    );
  }

  private autoSelectPolicy(policy: IPolicy): void {
    this.selectedPolicy = policy;
    this.policySelectionForm.patchValue({ policyId: policy.policyId });
    this.paymentDetailsForm.patchValue({
      amount: policy.premiumAmount,
    });
  }

  onPolicySelected(): void {
    const policyId = this.policySelectionForm.get('policyId')?.value;
    const policy = this.policies.find((p) => p.policyId === policyId);
    if (policy) {
      this.selectedPolicy = policy;
      this.paymentDetailsForm.patchValue({
        amount: policy.premiumAmount,
      });
    }
  }

  get selectedPaymentMethod(): string {
    return this.paymentDetailsForm.get('paymentMethod')?.value || 'credit_card';
  }

  get isCardPayment(): boolean {
    return ['credit_card', 'debit_card'].includes(this.selectedPaymentMethod);
  }

  get isUpiPayment(): boolean {
    return this.selectedPaymentMethod === 'upi';
  }

  get isNetBankingPayment(): boolean {
    return this.selectedPaymentMethod === 'net_banking';
  }

  /** Check if a specific field has a given error and has been touched */
  fieldHasError(form: FormGroup, field: string, error: string): boolean {
    const control = form.get(field);
    return !!control && control.hasError(error) && (control.dirty || control.touched);
  }

  /** Returns true when the payment details form is valid for the selected method */
  get canProceedToPayment(): boolean {
    if (!this.selectedPolicy) return false;
    const method = this.selectedPaymentMethod;
    const f = this.paymentDetailsForm;

    if (method === 'credit_card' || method === 'debit_card') {
      return (
        !f.get('cardNumber')!.invalid && !f.get('cardExpiry')!.invalid && !f.get('cardCvv')!.invalid
      );
    } else if (method === 'upi') {
      return !f.get('upiId')!.invalid;
    } else if (method === 'net_banking') {
      return !f.get('netBankingId')!.invalid;
    }
    return true;
  }

  /** Mark all relevant fields as touched to trigger error display */
  private markPaymentFieldsTouched(): void {
    const method = this.selectedPaymentMethod;
    if (method === 'credit_card' || method === 'debit_card') {
      this.paymentDetailsForm.get('cardNumber')!.markAsTouched();
      this.paymentDetailsForm.get('cardExpiry')!.markAsTouched();
      this.paymentDetailsForm.get('cardCvv')!.markAsTouched();
    } else if (method === 'upi') {
      this.paymentDetailsForm.get('upiId')!.markAsTouched();
    } else if (method === 'net_banking') {
      this.paymentDetailsForm.get('netBankingId')!.markAsTouched();
    }
  }

  processPayment(): void {
    if (!this.selectedPolicy) return;

    // Validate before processing
    this.markPaymentFieldsTouched();
    if (!this.canProceedToPayment) {
      this.snackBar.open('Please fix the validation errors before proceeding.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isProcessing = true;

    // Simulate payment processing delay
    setTimeout(() => {
      try {
        const payment = this.paymentService.processPayment({
          policyId: this.selectedPolicy!.policyId,
          amount: this.selectedPolicy!.premiumAmount,
          status: 'completed',
          paymentMethod: this.paymentDetailsForm.get('paymentMethod')?.value,
        });

        this.lastPayment = payment;
        this.paymentComplete = true;
        this.isProcessing = false;

        // Emit SSE event
        this.ssePublisher.emitPaymentCompleted(payment);

        this.snackBar.open('Payment processed successfully!', 'Close', {
          duration: 4000,
          panelClass: ['success-snackbar'],
        });

        // Move to confirmation step
        this.stepper.next();
      } catch (error) {
        this.isProcessing = false;
        this.ssePublisher.emitPaymentFailed({
          policyId: this.selectedPolicy!.policyId,
          reason: 'Processing error',
        });
        this.snackBar.open('Payment failed. Please try again.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      }
    }, 2000);
  }

  viewReceipt(): void {
    if (this.lastPayment) {
      this.showReceipt = true;
    }
  }

  closeReceipt(): void {
    this.showReceipt = false;
  }

  printReceipt(): void {
    window.print();
  }

  resetForm(): void {
    this.stepper.reset();
    this.selectedPolicy = null;
    this.paymentComplete = false;
    this.lastPayment = null;
    this.showReceipt = false;
    this.policySelectionForm.reset();
    this.paymentDetailsForm.reset({ paymentMethod: 'credit_card' });
    this.sseListener.clearSelectedPolicy();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
