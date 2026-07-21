import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Winner } from '../models/winner.model';
import { SseService } from './sse.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WinnerService {
  // State management using Angular Signals
  private allWinnersSignal = signal<Winner[]>([]);
  private latestWinnerSignal = signal<Winner | null>(null);
  private firstPrizeWinnerSignal = signal<Winner | null>(null);
  private showLoaderSignal = signal<boolean>(false);
  private isInitialLoadingSignal = signal<boolean>(true);
  
  // Publicly exposed readonly signals
  public allWinners = computed(() => this.allWinnersSignal());
  public latestWinner = computed(() => this.latestWinnerSignal());
  public firstPrizeWinner = computed(() => this.firstPrizeWinnerSignal());
  public showLoader = computed(() => this.showLoaderSignal());
  public isInitialLoading = computed(() => this.isInitialLoadingSignal());

  // Carousel winners computed from the historical data (excluding current latest and first prize, or just everything except latest)
  public previouslyWinners = computed(() => {
    const latest = this.latestWinnerSignal();
    const list = this.allWinnersSignal();
    // Return winners excluding the active grand winner
    return list.filter(w => w !== latest);
  });

  // A signal to trigger celebration animation in components
  public triggerCelebration = signal<number>(0);

  constructor(
    private http: HttpClient,
    private sseService: SseService,
    private snackBar: MatSnackBar
  ) {
    this.initializeData();
    this.setupSseListener();
  }

  private initializeData(): void {
    this.http.get<{ success: boolean; coupons: any[] }>(`${environment.apiUrl}/coupons/public`)
      .subscribe({
        next: (response) => {
          if (response.success && response.coupons.length > 0) {
            const winners: Winner[] = response.coupons.map((c: any) => ({
              couponNumber: c.couponNumber,
              prizeName: c.prizeName,
              prizeNumber: c.prizeNumber,
              customerName: c.customerName,
              agentName: c.agentName,
              createdDate: new Date(c.createdAt).toLocaleDateString('en-GB'),
              avatarUrl: '',
              timeString: this.getTimeAgo(c.createdAt)
            }));

            this.allWinnersSignal.set(winners);
            // Latest winner = most recent entry (first in sorted list)
            this.latestWinnerSignal.set(winners[0]);
            // First prize winner = first one with prizeNumber '1'
            const firstPrize = winners.find(w => w.prizeNumber === '1');
            this.firstPrizeWinnerSignal.set(firstPrize || null);
          }
          this.isInitialLoadingSignal.set(false);
        },
        error: (err) => {
          console.error('Failed to load winners from API:', err);
          this.isInitialLoadingSignal.set(false);
        }
      });
  }

  private getTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }


  private setupSseListener(): void {
    this.sseService.newWinner$.subscribe((newWinner: Winner) => {
      this.handleNewWinnerDrawn(newWinner);
    });
  }

  private handleNewWinnerDrawn(newWinner: Winner): void {
    // 1. Show 5-second loader in Customer Dashboard
    this.showLoaderSignal.set(true);

    // 2. Duration of 5 seconds for reveal animation
    setTimeout(() => {
      const currentList = this.allWinnersSignal();
      
      if (!newWinner.avatarUrl) {
        const avatarIndex = Math.floor(Math.random() * 70) + 1;
        newWinner.avatarUrl = `https://i.pravatar.cc/150?img=${avatarIndex}`;
      }
      newWinner.timeString = 'Just now';
      
      // Prepend to list (avoid duplicates by couponNumber)
      const updatedList = [newWinner, ...currentList.filter(w => w.couponNumber !== newWinner.couponNumber)];
      this.allWinnersSignal.set(updatedList);
      
      // Update latest winner announcement (Grand Winner)
      this.latestWinnerSignal.set(newWinner);

      // If it's a first prize winner, update the first prize winner card as well
      if (newWinner.prizeNumber === '1') {
        this.firstPrizeWinnerSignal.set(newWinner);
      }

      // Hide 5-second loader
      this.showLoaderSignal.set(false);

      // Trigger confetti celebration animation
      this.triggerCelebration.update(v => v + 1);
    }, 5000);
  }

  private showWinnerToast(winner: Winner): void {
    // Notifications disabled
  }

  /**
   * Helper to trigger simulation manually
   */
  public triggerManualDraw(): void {
    // Manual local trigger
  }

  /**
   * Adds a new winner manually from the Admin portal with 5-second reveal loader trigger.
   */
  public addWinner(winner: Winner): void {
    this.sseService.broadcastNewWinner(winner);
  }

  /**
   * Deletes a winner by coupon number.
   */
  public deleteWinner(couponNumber: string): void {
    const currentList = this.allWinnersSignal();
    const target = currentList.find(w => w.couponNumber === couponNumber);
    if (!target) return;

    const updatedList = currentList.filter(w => w.couponNumber !== couponNumber);
    this.allWinnersSignal.set(updatedList);

    // If deleted winner was latest grand winner, set it to the next available one
    if (this.latestWinnerSignal()?.couponNumber === couponNumber) {
      this.latestWinnerSignal.set(updatedList.length > 0 ? updatedList[0] : null);
    }

    // If deleted winner was first prize winner, clear it or find next one with prizeNumber '1'
    if (this.firstPrizeWinnerSignal()?.couponNumber === couponNumber) {
      const nextFirst = updatedList.find(w => w.prizeNumber === '1');
      this.firstPrizeWinnerSignal.set(nextFirst || null);
    }
  }
}
