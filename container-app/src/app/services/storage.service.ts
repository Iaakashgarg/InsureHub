import { Injectable } from '@angular/core';
import { StorageAdapter } from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class StorageService {
  set<T>(key: string, value: T): void {
    StorageAdapter.set(key, value);
  }

  get<T>(key: string): T | null {
    return StorageAdapter.get<T>(key);
  }

  remove(key: string): void {
    StorageAdapter.remove(key);
  }

  clear(): void {
    StorageAdapter.clear();
  }
}
