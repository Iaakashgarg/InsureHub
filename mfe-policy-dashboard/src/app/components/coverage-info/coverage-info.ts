import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ICoverage } from 'shared-lib';

@Component({
  selector: 'app-coverage-info',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule, MatDividerModule],
  templateUrl: './coverage-info.html',
  styleUrl: './coverage-info.scss',
})
export class CoverageInfo {
  @Input() coverages: ICoverage[] = [];
}
