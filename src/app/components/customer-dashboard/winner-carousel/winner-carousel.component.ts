import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WinnerService } from '../../../services/winner.service';

@Component({
  selector: 'app-winner-carousel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './winner-carousel.component.html',
  styleUrl: './winner-carousel.component.scss'
})
export class WinnerCarouselComponent {
  @ViewChild('carouselContainer', { static: false }) 
  private carouselContainer!: ElementRef<HTMLDivElement>;

  constructor(public winnerService: WinnerService) {}

  scrollLeft(): void {
    if (this.carouselContainer) {
      const el = this.carouselContainer.nativeElement;
      el.scrollBy({ left: -280, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (this.carouselContainer) {
      const el = this.carouselContainer.nativeElement;
      el.scrollBy({ left: 280, behavior: 'smooth' });
    }
  }
}
