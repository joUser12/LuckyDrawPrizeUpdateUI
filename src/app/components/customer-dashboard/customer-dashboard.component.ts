import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { LiveFeedComponent } from './live-feed/live-feed.component';
import { LatestWinnerComponent } from './latest-winner/latest-winner.component';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    LoaderComponent,
    LiveFeedComponent,
    LatestWinnerComponent
  ],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss'
})
export class CustomerDashboardComponent {}
