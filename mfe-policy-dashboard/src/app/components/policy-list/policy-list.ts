import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IPolicy } from 'shared-lib';
import { PolicyService } from '../../services/policy.service';
import { SsePublisherService } from '../../services/sse-publisher.service';
import { PremiumWorkerService } from '../../services/premium-worker.service';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './policy-list.html',
  styleUrl: './policy-list.scss',
})
export class PolicyList implements OnInit, AfterViewInit {
  displayedColumns = ['policyNumber', 'holderName', 'type', 'premiumAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<IPolicy>();
  premiumResults: Map<string, any> = new Map();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private policyService: PolicyService,
    private ssePublisher: SsePublisherService,
    private premiumWorker: PremiumWorkerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const policies = this.policyService.getAllPolicies();
    this.dataSource.data = policies;

    // Run Web Worker to calculate premium projections
    this.premiumWorker.calculatePremiums(policies).subscribe((result) => {
      if (result.type === 'CALCULATION_COMPLETE') {
        result.results.forEach((r: any) => {
          this.premiumResults.set(r.policyId, r);
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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

  viewPolicy(policy: IPolicy): void {
    this.router.navigate(['/policies', policy.id]);
  }

  payPremium(policy: IPolicy): void {
    this.ssePublisher.emitPolicySelected(policy);
    this.ssePublisher.emitNavigateToPayment(policy.id);
  }
}
