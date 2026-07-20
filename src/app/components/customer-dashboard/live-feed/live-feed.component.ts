import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WinnerService } from '../../../services/winner.service';

@Component({
  selector: 'app-live-feed',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './live-feed.component.html',
  styleUrl: './live-feed.component.scss'
})
export class LiveFeedComponent {
  constructor(public winnerService: WinnerService) {}
}
