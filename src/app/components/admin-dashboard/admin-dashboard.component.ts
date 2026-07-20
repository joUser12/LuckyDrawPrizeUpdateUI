import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WinnerService } from '../../services/winner.service';
import { Winner } from '../../models/winner.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  showAddForm = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  showAll = signal<boolean>(false);
  readonly PAGE_SIZE = 15;
  displayedColumns = ['avatar', 'customer', 'coupon', 'prize', 'agent', 'date', 'actions'];

  /** Returns only the first 15 winners unless showAll is toggled */
  visibleWinners = computed(() =>
    this.showAll()
      ? this.winnerService.allWinners()
      : this.winnerService.allWinners().slice(0, this.PAGE_SIZE)
  );

  hasMore = computed(() =>
    this.winnerService.allWinners().length > this.PAGE_SIZE
  );

  toggleShowAll(): void {
    this.showAll.update(v => !v);
  }

  addForm: FormGroup;

  prizeOptions = [
    { number: '1', name: 'Smart LED TV' },
    { number: '2', name: 'Cooker' },
    { number: '3', name: 'Refrigerator' },
    { number: '4', name: 'Microwave Oven' },
    { number: '5', name: 'Air Fryer' },
    { number: '6', name: 'Induction Cooktop' },
    { number: '7', name: 'Vacuum Cleaner' },
    { number: '8', name: 'Smart Watch' }
  ];

  constructor(
    public winnerService: WinnerService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.addForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      couponNumber: ['', [Validators.required]],
      prizeNumber:  ['', [Validators.required]],
      agentName:    ['', [Validators.required]]
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.addForm.reset();
    }
  }

  submitWinner(): void {
    if (this.addForm.invalid) return;
    this.isSubmitting.set(true);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const formVal = this.addForm.value;
    const knownPrizes: Record<string, string> = {
      '1': 'Smart LED TV',
      '2': 'Cooker',
      '3': 'Refrigerator',
      '4': 'Microwave Oven',
      '5': 'Air Fryer',
      '6': 'Induction Cooktop',
      '7': 'Vacuum Cleaner',
      '8': 'Smart Watch'
    };
    const pNum = String(formVal.prizeNumber);
    const computedPrizeName = knownPrizes[pNum] || `Prize ${pNum}`;

    const newWinner: Winner = {
      customerName: formVal.customerName,
      couponNumber: String(formVal.couponNumber),
      prizeNumber: pNum,
      prizeName: computedPrizeName,
      agentName: formVal.agentName,
      createdDate: `${day}/${month}/${year}`,
      timeString: 'Just now'
    };

    setTimeout(() => {
      this.winnerService.addWinner(newWinner);
      this.addForm.reset();
      this.showAddForm.set(false);
      this.isSubmitting.set(false);
    }, 400);
  }

  deleteWinner(couponNumber: string): void {
    this.winnerService.deleteWinner(couponNumber);
  }

  logout(): void {
    this.router.navigate(['/']);
  }

  goToPortal(): void {
    this.router.navigate(['/dashboard']);
  }
}
