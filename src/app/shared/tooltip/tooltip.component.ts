import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <div class="tooltip-box">
      {{ text }}
    </div>
  `,
  styles: [`
    .tooltip-box {
      white-space: pre;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 12px;
      max-width: 220px;
      z-index: 9999;
    }
  `]
})
export class TooltipComponent {
  @Input() text = '';
}
