import { Directive, ElementRef, HostListener, Input, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appDecimalInput]'
})
export class DecimalInputDirective implements AfterViewInit {
  @Input() maxDecimals: number = 10;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => this.applyInitialFormat(), 0); 
  }

  @HostListener('focus') onFocus() {
    const value = this.el.nativeElement.value.replace(/\./g, '').replace(',', '.');
    this.el.nativeElement.value = value;
  }

  @HostListener('blur') onBlur() {
    const value = parseFloat(this.el.nativeElement.value.replace(',', '.'));
    if (!isNaN(value)) {
      this.el.nativeElement.value = this.formatDecimals(value);
    } else {
      this.el.nativeElement.value = '';
    }
  }

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Limita la entrada a números, comas y puntos
    value = value.replace(/[^0-9,.]/g, ''); 
    input.value = value;
  }

  private applyInitialFormat() {
    const initialValue = parseFloat(this.el.nativeElement.value.replace(',', '.'));
    if (!isNaN(initialValue)) {
      this.el.nativeElement.value = this.formatDecimals(initialValue);
    }
  }

  private formatDecimals(value: number): string {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: this.maxDecimals
    });
  }
}
