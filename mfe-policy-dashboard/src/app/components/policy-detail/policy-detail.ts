import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { IPolicy } from 'shared-lib';
import { PolicyService } from '../../services/policy.service';
import { SsePublisherService } from '../../services/sse-publisher.service';
import { CoverageInfo } from '../coverage-info/coverage-info';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    CoverageInfo,
  ],
  templateUrl: './policy-detail.html',
  styleUrl: './policy-detail.scss',
})
export class PolicyDetail implements OnInit {
  policy: IPolicy | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService,
    private ssePublisher: SsePublisherService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.policy = this.policyService.getPolicyById(id);
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'primary';
      case 'expired':
        return 'warn';
      case 'pending':
        return 'accent';
      default:
        return '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'life':
        return 'favorite';
      case 'health':
        return 'local_hospital';
      case 'vehicle':
        return 'directions_car';
      case 'home':
        return 'home';
      default:
        return 'policy';
    }
  }

  onPayPremium(): void {
    if (this.policy) {
      this.ssePublisher.emitPolicySelected(this.policy);
      this.ssePublisher.emitNavigateToPayment(this.policy.id);
    }
  }

  goBack(): void {
    this.router.navigate(['/policies']);
  }
}
