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
    // Elimina el formato al enfocar
    this.el.nativeElement.value = this.parseValue(this.el.nativeElement.value);
  }

  @HostListener('blur') onBlur() {
    // Aplica el formato al desenfocar
    this.handleValueChange();
  }

  @HostListener('change') onChange() {
    // Maneja los valores seleccionados del autocompletado
    this.handleValueChange();
  }

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Limita la entrada a números, comas y puntos
    value = value.replace(/[^0-9,.]/g, '');
    input.value = value;
  }

  private handleValueChange() {
    const value = parseFloat(this.parseValue(this.el.nativeElement.value));
    if (!isNaN(value)) {
      this.el.nativeElement.value = this.formatDecimals(value);
    } else {
      this.el.nativeElement.value = '';
    }
  }

  private applyInitialFormat() {
    const initialValue = parseFloat(this.parseValue(this.el.nativeElement.value));
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

  private parseValue(value: string): string {
    // Convierte valores al formato numérico adecuado
    return value.replace(/\./g, '').replace(',', '.');
  }
}
