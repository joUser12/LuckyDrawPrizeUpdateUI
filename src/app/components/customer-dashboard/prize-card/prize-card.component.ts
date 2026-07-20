import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WinnerService } from '../../../services/winner.service';

@Component({
  selector: 'app-prize-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './prize-card.component.html',
  styleUrl: './prize-card.component.scss'
})
export class PrizeCardComponent {
  constructor(public winnerService: WinnerService) {}
}
