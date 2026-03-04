import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { SseBrokerService } from './services/sse-broker.service';
import { StorageAdapter, IPolicy } from 'shared-lib';
import { MOCK_POLICIES } from './data/mock-policies';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Header, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(private sseBrokerService: SseBrokerService) {}

  ngOnInit(): void {
    // Seed mock data on first load
    const existing = StorageAdapter.get<IPolicy[]>('policies');
    if (!existing || existing.length === 0) {
      StorageAdapter.set('policies', MOCK_POLICIES);
    }
  }
}
