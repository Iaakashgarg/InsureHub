import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StorageAdapter, IPolicy, IPayment } from 'shared-lib';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  totalPolicies = 0;
  activePolicies = 0;
  pendingPayments = 0;
  totalPaid = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const policies = StorageAdapter.get<IPolicy[]>('policies') || [];
    const payments = StorageAdapter.get<IPayment[]>('payments') || [];

    this.totalPolicies = policies.length;
    this.activePolicies = policies.filter((p) => p.status === 'active').length;
    this.pendingPayments = policies.filter((p) => p.status === 'active').length;
    this.totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
