import { Directive, ElementRef, HostListener, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appCurrencyInput]'
})
export class CurrencyInputDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => this.applyInitialFormat(), 0); // Asegura el formato después de la carga completa
  }

  @HostListener('focus') onFocus() {
    const value = this.el.nativeElement.value.replace(/\./g, '').replace(',', '.');
    this.el.nativeElement.value = value;
  }

  @HostListener('blur') onBlur() {
    const value = parseFloat(this.el.nativeElement.value.replace(',', '.'));
    if (!isNaN(value)) {
      this.el.nativeElement.value = this.formatCurrency(value);
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
      this.el.nativeElement.value = this.formatCurrency(initialValue);
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
