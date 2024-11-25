import { Directive, ElementRef, HostListener, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appInvestmentInput]'
})
export class InvestmentInputDirective implements AfterViewInit, OnDestroy {
  private observer: MutationObserver | undefined;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.applyInitialFormat();

    // Observa cambios en el atributo "disabled" para aplicar el formato al habilitar/deshabilitar
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'disabled') {
          this.applyInitialFormat();
        }
      });
    });

    this.observer.observe(this.el.nativeElement, { attributes: true });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
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
      this.el.nativeElement.value = this.formatCurrency(value);
    } else {
      this.el.nativeElement.value = '';
    }
  }

  private applyInitialFormat() {
    const initialValue = this.el.nativeElement.value;
    const numericValue = parseFloat(this.parseValue(initialValue));
    if (initialValue && !isNaN(numericValue)) {
      this.el.nativeElement.value = this.formatCurrency(numericValue);
    }
  }

  private formatCurrency(value: number): string {
    // Verifica si el número tiene 3 cifras o menos
    if (Math.abs(value) < 1000) {
      // Retorna todos los decimales presentes sin redondear
      return value.toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10
      });
    }
    // Para números con más de 3 cifras, formatea con 2 decimales
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private parseValue(value: string): string {
    // Convierte valores al formato numérico adecuado
    if (value.includes('.') && value.includes(',')) {
      return value.replace(/\./g, '').replace(',', '.');
    } else if (value.includes('.')) {
      return value.replace(/,/g, '');
    }
    return value.replace(',', '.'); // Convierte ',' en '.' para interpretación numérica
  }
}
