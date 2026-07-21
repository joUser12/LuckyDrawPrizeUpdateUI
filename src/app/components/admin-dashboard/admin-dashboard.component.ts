import { Component, OnInit, signal, computed, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WinnerService } from '../../services/winner.service';
import { CouponService, Coupon } from '../../services/coupon.service';
import { AuthService } from '../../services/auth.service';
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
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  showAddForm = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  showAll = signal<boolean>(false);
  coupons = signal<Coupon[]>([]);

  readonly PAGE_SIZE = 15;
  displayedColumns = ['avatar', 'customer', 'coupon', 'prize', 'agent', 'date', 'actions'];

  visibleCoupons = computed(() =>
    this.showAll()
      ? this.coupons()
      : this.coupons().slice(0, this.PAGE_SIZE)
  );

  hasMore = computed(() => this.coupons().length > this.PAGE_SIZE);

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
    private couponService: CouponService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.addForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      couponNumber: ['', [Validators.required]],
      prizeNumber:  ['', [Validators.required]],
      prizeName:    ['', [Validators.required]],
      agentName:    ['', [Validators.required]]
    });

    this.addForm.get('prizeNumber')?.valueChanges.subscribe(pNum => {
      const knownPrizes: Record<string, string> = {
        '1': 'Smart LED TV', '2': 'Cooker', '3': 'Refrigerator',
        '4': 'Microwave Oven', '5': 'Air Fryer', '6': 'Induction Cooktop',
        '7': 'Vacuum Cleaner', '8': 'Smart Watch'
      };
      const numStr = String(pNum);
      if (knownPrizes[numStr] && !this.addForm.get('prizeName')?.value) {
        this.addForm.get('prizeName')?.setValue(knownPrizes[numStr]);
      }
    });
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.isLoading.set(true);
    this.couponService.getAllCoupons().subscribe({
      next: (res) => {
        if (res.success && res.coupons) {
          this.coupons.set(res.coupons);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Load coupons error:', err);
        this.snackBar.open('Failed to load coupons', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
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

    const formVal = this.addForm.value;
    const pNum = String(formVal.prizeNumber);

    const payload = {
      couponNumber: String(formVal.couponNumber),
      prizeName: formVal.prizeName,
      prizeNumber: pNum,
      customerName: formVal.customerName,
      agentName: formVal.agentName
    };

    this.couponService.createCoupon(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.coupon) {
          // Prepend to list
          this.coupons.update(list => [res.coupon!, ...list]);
          // Also trigger live broadcast via WinnerService/SignalR
          const winner: Winner = {
            couponNumber: res.coupon.couponNumber,
            prizeName: res.coupon.prizeName,
            prizeNumber: res.coupon.prizeNumber,
            customerName: res.coupon.customerName,
            agentName: res.coupon.agentName,
            createdDate: new Date(res.coupon.createdAt || '').toLocaleDateString('en-GB'),
            timeString: 'Just now'
          };
          this.winnerService.addWinner(winner);
        }
        this.addForm.reset();
        this.showAddForm.set(false);
        this.snackBar.open('✅ Coupon added successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to create coupon';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  deleteWinner(id: string, couponNumber: string): void {
    if (!confirm(`Delete coupon #${couponNumber}?`)) return;

    this.couponService.deleteCoupon(id).subscribe({
      next: () => {
        this.coupons.update(list => list.filter(c => c._id !== id));
        this.winnerService.deleteWinner(couponNumber);
        this.snackBar.open('🗑️ Coupon deleted', 'Close', { duration: 2500 });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete coupon';
        this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  goToPortal(): void {
    this.router.navigate(['/dashboard']);
  }
}


