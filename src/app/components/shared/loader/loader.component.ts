import { Component, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WinnerService } from '../../../services/winner.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnDestroy {
  public countdown = signal<number | string>(5);
  private timerId: any = null;

  constructor(public winnerService: WinnerService) {
    effect(() => {
      const isShowing = this.winnerService.showLoader();
      if (isShowing) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    });
  }

  private startCountdown(): void {
    this.stopCountdown();
    let val = 5;
    this.countdown.set(val);
    
    this.timerId = setInterval(() => {
      val--;
      if (val > 0) {
        this.countdown.set(val);
      } else if (val === 0) {
        this.countdown.set("LET'S GO!");
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
