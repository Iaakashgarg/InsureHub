import { Injectable } from '@angular/core';
import { StorageAdapter, IPolicy } from 'shared-lib';

const STORAGE_KEY = 'policies';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  getAllPolicies(): IPolicy[] {
    return StorageAdapter.get<IPolicy[]>(STORAGE_KEY) || [];
  }

  getPolicyById(id: string): IPolicy | undefined {
    const policies = this.getAllPolicies();
    return policies.find((p) => p.id === id);
  }

  updatePolicy(updated: IPolicy): void {
    const policies = this.getAllPolicies();
    const idx = policies.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      policies[idx] = updated;
      StorageAdapter.set(STORAGE_KEY, policies);
    }
  }

  deletePolicy(id: string): void {
    const policies = this.getAllPolicies().filter((p) => p.id !== id);
    StorageAdapter.set(STORAGE_KEY, policies);
  }
}
