import {
  Directive,
  Input,
  HostListener,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';

import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private static readonly instances = new Set<TooltipDirective>();

  @Input('appTooltip') tooltipText: string = '';

  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private overlayRef?: OverlayRef;

  constructor() {
    TooltipDirective.instances.add(this);
  }

  ngOnDestroy(): void {
    TooltipDirective.instances.delete(this);
    this.hide();
  }

  static dismissAll(): void {
    for (const instance of TooltipDirective.instances) {
      instance.hide();
    }
  }

  @HostListener('mouseenter')
  show() {
    if (!this.tooltipText) {
      return;
    }

    if (this.overlayRef) {
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ]);

    this.overlayRef = this.overlay.create({ positionStrategy });

    const componentRef = this.overlayRef.attach(
      new ComponentPortal(TooltipComponent)
    );

    componentRef.instance.text = this.tooltipText;
    this.overlayRef.overlayElement.style.pointerEvents = 'none';
  }

  @HostListener('mouseleave')
  hide() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  @HostListener('document:pointerdown')
  @HostListener('document:touchstart')
  forceHide() {
    this.hide();
  }
}
