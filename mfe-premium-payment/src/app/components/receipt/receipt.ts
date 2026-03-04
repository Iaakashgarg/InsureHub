import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { IPayment, IPolicy } from 'shared-lib';

export interface ReceiptDialogData {
  payment: IPayment;
  policy: IPolicy | null;
}

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './receipt.html',
  styleUrl: './receipt.scss',
})
export class Receipt {
  constructor(
    public dialogRef: MatDialogRef<Receipt>,
    @Inject(MAT_DIALOG_DATA) public data: ReceiptDialogData,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  printReceipt(): void {
    window.print();
  }
}
