import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Winner } from '../models/winner.model';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private newWinnerSubject = new Subject<Winner>();
  public newWinner$: Observable<Winner> = this.newWinnerSubject.asObservable();
  private channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('luckydraw_live_channel') : null;

  // Mock list of names, agents, prizes for simulation
  private names = [
    'john', 'emily', 'michael', 'sarah', 'david', 'jessica', 
    'robert', 'ashley', 'william', 'amanda', 'james', 'lisa', 
    'joseph', 'karen', 'thomas', 'nancy', 'ryan', 'megan'
  ];

  private agents = ['JOY S', 'ALEX M', 'ROSE T', 'NIK K', 'SAM P', 'KUMAR G', 'ANIL K'];

  private prizes = [
    { name: 'Smart LED TV', number: '1' },
    { name: 'Cooker', number: '2' },
    { name: 'Refrigerator', number: '3' },
    { name: 'Microwave Oven', number: '4' },
    { name: 'Air Fryer', number: '5' },
    { name: 'Induction Cooktop', number: '6' },
    { name: 'Vacuum Cleaner', number: '7' },
    { name: 'Smart Watch', number: '8' }
  ];

  private currentCoupon = 122;

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event) => {
        if (event && event.data) {
          this.newWinnerSubject.next(event.data);
        }
      };
    }
  }

  /**
   * Triggers a simulated SignalR event from the Admin portal with cross-tab BroadcastChannel sync.
   */
  public simulateNewWinner(customWinner?: Winner): void {
    const winner = customWinner || this.generateRandomWinner();
    if (this.channel) {
      this.channel.postMessage(winner);
    }
    this.newWinnerSubject.next(winner);
  }

  private triggerAutoDraw(): void {
    // Generate and emit a random draw in the background
    this.simulateNewWinner();
  }

  private generateRandomWinner(): Winner {
    this.currentCoupon += Math.floor(Math.random() * 5) + 1;
    const randomName = this.names[Math.floor(Math.random() * this.names.length)];
    const randomAgent = this.agents[Math.floor(Math.random() * this.agents.length)];
    const randomPrizeObj = this.prizes[Math.floor(Math.random() * this.prizes.length)];
    
    // Get formatted current date: DD/MM/YYYY
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Avatars can be local/generated
    const avatarIndex = Math.floor(Math.random() * 70) + 1;

    return {
      couponNumber: String(this.currentCoupon),
      prizeName: randomPrizeObj.name,
      prizeNumber: randomPrizeObj.number,
      customerName: randomName,
      agentName: randomAgent,
      createdDate: formattedDate,
      avatarUrl: `https://i.pravatar.cc/150?img=${avatarIndex}`,
      timeString: 'Just now'
    };
  }
}
