import { Injectable, signal, computed } from '@angular/core';
import { Winner } from '../models/winner.model';
import { SignalrService } from './signalr.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private signalrService: SignalrService,
    private snackBar: MatSnackBar
  ) {
    this.initializeData();
    this.setupSignalRListener();
  }

  private initializeData(): void {
    // Simulating initial API call latency
    setTimeout(() => {
      const initialWinners: Winner[] = [
        {
          couponNumber: '122',
          prizeName: 'Cooker',
          prizeNumber: '2',
          customerName: 'john',
          agentName: 'JOY S',
          createdDate: '19/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=11',
          timeString: '2 mins ago'
        },
        {
          couponNumber: '788',
          prizeName: 'Cooker',
          prizeNumber: '1',
          customerName: 'johnnnn',
          agentName: 'JOY S',
          createdDate: '19/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=12',
          timeString: '10 mins ago'
        },
        {
          couponNumber: '95',
          prizeName: 'Smart LED TV',
          prizeNumber: '1',
          customerName: 'Emily Watson',
          agentName: 'ALEX M',
          createdDate: '18/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=20',
          timeString: '1 hour ago'
        },
        {
          couponNumber: '412',
          prizeName: 'Refrigerator',
          prizeNumber: '3',
          customerName: 'David Miller',
          agentName: 'ROSE T',
          createdDate: '18/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=33',
          timeString: '3 hours ago'
        },
        {
          couponNumber: '304',
          prizeName: 'Microwave Oven',
          prizeNumber: '4',
          customerName: 'Sarah Connor',
          agentName: 'NIK K',
          createdDate: '17/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=47',
          timeString: '1 day ago'
        },
        {
          couponNumber: '159',
          prizeName: 'Air Fryer',
          prizeNumber: '5',
          customerName: 'Michael Chang',
          agentName: 'SAM P',
          createdDate: '17/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=65',
          timeString: '1 day ago'
        },
        {
          couponNumber: '281',
          prizeName: 'Smart Watch',
          prizeNumber: '8',
          customerName: 'Robert Dow',
          agentName: 'KUMAR G',
          createdDate: '16/07/2026',
          avatarUrl: 'https://i.pravatar.cc/150?img=52',
          timeString: '2 days ago'
        }
      ];

      this.allWinnersSignal.set(initialWinners);
      // Latest grand winner defaults to the first one in the list (john)
      this.latestWinnerSignal.set(initialWinners[0]);
      // First prize winner is the one with prizeNumber '1' and prizeName 'Cooker' (johnnnn, Coupon 788)
      this.firstPrizeWinnerSignal.set(initialWinners[1]);
      
      this.isInitialLoadingSignal.set(false);
    }, 1500); // 1.5 second initial load skeleton simulator
  }

  private setupSignalRListener(): void {
    this.signalrService.newWinner$.subscribe((newWinner: Winner) => {
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
    this.signalrService.simulateNewWinner();
  }

  /**
   * Adds a new winner manually from the Admin portal with 5-second reveal loader trigger.
   */
  public addWinner(winner: Winner): void {
    this.signalrService.simulateNewWinner(winner);
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
