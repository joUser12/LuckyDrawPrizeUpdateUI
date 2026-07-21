import { Component, ElementRef, ViewChild, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  shape: 'circle' | 'square' | 'triangle' | 'star';
}

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

  @ViewChild('loaderConfettiCanvas', { static: false }) 
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isDrawing = false;
  private colors = ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff', '#e11d48', '#a855f7', '#38bdf8'];

  constructor(public winnerService: WinnerService) {
    effect(() => {
      const isShowing = this.winnerService.showLoader();
      if (isShowing) {
        this.startCountdown();
        setTimeout(() => this.startCelebrationConfetti(), 100);
      } else {
        this.stopCountdown();
        this.stopCelebrationConfetti();
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

  private startCelebrationConfetti(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.particles = [];
    this.generateParticles(150, canvas.width, canvas.height);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.animateConfetti();
    }
  }

  private generateParticles(count: number, width: number, height: number): void {
    const shapes: ('circle' | 'square' | 'triangle' | 'star')[] = ['circle', 'square', 'triangle', 'star'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        radius: Math.random() * 6 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      });
    }
  }

  private animateConfetti = (): void => {
    if (!this.isDrawing || !this.ctx || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.rotationSpeed;

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
      } else {
        // Star shape
        for (let i = 0; i < 5; i++) {
          this.ctx!.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * p.radius, -Math.sin((18 + i * 72) * Math.PI / 180) * p.radius);
          this.ctx!.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (p.radius / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (p.radius / 2));
        }
      }

      this.ctx!.closePath();
      this.ctx!.fill();
      this.ctx!.restore();

      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });

    this.animationFrameId = requestAnimationFrame(this.animateConfetti);
  };

  private stopCelebrationConfetti(): void {
    this.isDrawing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.stopCelebrationConfetti();
  }
}
