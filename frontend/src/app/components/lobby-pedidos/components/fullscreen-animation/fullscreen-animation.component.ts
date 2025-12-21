import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fullscreen-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fullscreen-animation.component.html',
  styleUrl: './fullscreen-animation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenAnimationComponent {
  readonly isAnimating = input<boolean>(false);
  readonly video1Url = input<string | null>(null);
  readonly video2Url = input<string | null>(null);
}

