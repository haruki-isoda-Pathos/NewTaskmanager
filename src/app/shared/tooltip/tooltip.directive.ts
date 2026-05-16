import {
  Directive,
  Input,
  HostListener,
  ElementRef,
  inject
} from '@angular/core';

import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})

export class TooltipDirective {

  @Input('appTooltip') tooltipText: string = '';

  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private overlayRef?: OverlayRef;

  @HostListener('mouseenter')
  show() {

    if (!this.tooltipText) return;

    if (this.overlayRef) return;

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',

          overlayX: 'center',
          overlayY: 'bottom',

          offsetY: -8
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy
    });

    const tooltipPortal =
      new ComponentPortal(TooltipComponent);

    const componentRef =
      this.overlayRef.attach(tooltipPortal);

    componentRef.instance.text =
      this.tooltipText;
  }

  @HostListener('mouseleave')
  hide() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }
}