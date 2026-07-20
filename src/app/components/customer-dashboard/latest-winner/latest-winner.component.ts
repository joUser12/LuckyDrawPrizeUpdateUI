import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WinnerService } from '../../../services/winner.service';

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'triangle';
}

@Component({
  selector: 'app-latest-winner',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './latest-winner.component.html',
  styleUrl: './latest-winner.component.scss'
})
export class LatestWinnerComponent {
  public winnerService = inject(WinnerService);
  
  @ViewChild('confettiCanvas', { static: false }) 
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isDrawing = false;
  private colors = ['#f472b6', '#c084fc', '#818cf8', '#fbbf24', '#34d399', '#38bdf8'];

  constructor() {
    // Monitor the celebration signal. Whenever it increments, fire confetti!
    effect(() => {
      const trigger = this.winnerService.triggerCelebration();
      if (trigger > 0) {
        this.fireConfetti();
      }
    });
  }

  public getCouponDigits(coupon: string | undefined): string[] {
    if (!coupon) return ['0', '0', '0', '0'];
    const str = coupon.toString().padStart(4, '0');
    return str.substring(str.length - 4).split('');
  }

  public triggerDraw(): void {
    this.winnerService.triggerManualDraw();
  }

  private fireConfetti(): void {
    if (!this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    // Resize canvas to match layout
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    this.particles = [];
    this.generateParticles(120, canvas.width, canvas.height);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.animate();
    }

    // Stop confetti after 5 seconds
    setTimeout(() => {
      this.isDrawing = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.ctx) {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 5000);
  }

  private generateParticles(count: number, width: number, height: number): void {
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * -50, // start just above the card
        radius: Math.random() * 5 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      });
    }
  }

  private animate = (): void => {
    if (!this.isDrawing || !this.ctx || !this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach((p, index) => {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.rotationSpeed;

      // Draw particle based on shape
      this.ctx!.save();
      this.ctx!.translate(p.x, p.y);
      this.ctx!.rotate((p.rotation * Math.PI) / 180);
      this.ctx!.fillStyle = p.color;
      this.ctx!.beginPath();

      if (p.shape === 'circle') {
        this.ctx!.arc(0, 0, p.radius, 0, Math.PI * 2);
      } else if (p.shape === 'square') {
        this.ctx!.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      } else if (p.shape === 'triangle') {
        this.ctx!.moveTo(0, -p.radius);
        this.ctx!.lineTo(p.radius, p.radius);
        this.ctx!.lineTo(-p.radius, p.radius);
      }

      this.ctx!.closePath();
      this.ctx!.fill();
      this.ctx!.restore();

      // Recirculate particles that go off-screen
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}
