import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Winner } from '../models/winner.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private newWinnerSubject = new Subject<Winner>();
  public newWinner$: Observable<Winner> = this.newWinnerSubject.asObservable();
  
  private eventSource: EventSource | null = null;
  private channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('luckydraw_live_channel') : null;

  constructor(private zone: NgZone) {
    this.initBroadcastChannel();
    this.connectSse();
  }

  /**
   * Initializes Cross-Tab Broadcast Channel listener (Local Dev / Multi-tab sync fallback)
   */
  private initBroadcastChannel(): void {
    if (this.channel) {
      this.channel.onmessage = (event) => {
        if (event && event.data) {
          this.zone.run(() => {
            this.newWinnerSubject.next(event.data);
          });
        }
      };
    }
  }

  /**
   * Establishes Server-Sent Events (SSE) connection to backend stream endpoint
   */
  public connectSse(): void {
    const streamUrl = `${environment.apiUrl}/coupons/stream`;

    try {
      if (typeof EventSource === 'undefined') {
        console.warn('[SSE] EventSource is not supported in this environment.');
        return;
      }

      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connected to backend live event stream:', streamUrl);
      };

      // Listen for custom event 'new-winner'
      this.eventSource.addEventListener('new-winner', (event: MessageEvent) => {
        this.zone.run(() => {
          this.handleIncomingEvent(event.data);
        });
      });

      // Listen for standard generic SSE messages
      this.eventSource.onmessage = (event: MessageEvent) => {
        this.zone.run(() => {
          this.handleIncomingEvent(event.data);
        });
      };

      this.eventSource.onerror = (error) => {
        console.warn('[SSE] EventSource connection error/lost. Will automatically attempt reconnecting...', error);
      };
    } catch (err) {
      console.error('[SSE] Failed to initialize EventSource:', err);
    }
  }

  private handleIncomingEvent(rawData: string): void {
    if (!rawData) return;
    try {
      const data = JSON.parse(rawData);
      if (data && data.couponNumber) {
        const winner: Winner = {
          couponNumber: String(data.couponNumber),
          prizeName: data.prizeName || 'Prize',
          prizeNumber: String(data.prizeNumber || '1'),
          customerName: data.customerName || 'Winner',
          agentName: data.agentName || 'Agent',
          createdDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          avatarUrl: data.avatarUrl || '',
          timeString: 'Just now'
        };
        this.newWinnerSubject.next(winner);
      }
    } catch (e) {
      console.error('[SSE] Failed to parse SSE payload:', e);
    }
  }

  /**
   * Triggers a local/admin broadcast event and sends message over BroadcastChannel
   */
  public broadcastNewWinner(winner: Winner): void {
    if (this.channel) {
      this.channel.postMessage(winner);
    }
    this.newWinnerSubject.next(winner);
  }

  /**
   * Close connection on service destruction
   */
  public closeSse(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
