import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingRowsTableComponent } from './spending-rows-table.component';
import { SpendingRow } from '../../../features/report/models/income-expense.model';

// plan-ingresos-egresos-por-fecha-de-compra.md, Fase 9, decisión D — las filas que componen un número, con su origen.
describe('SpendingRowsTableComponent', () => {
  let fixture: ComponentFixture<SpendingRowsTableComponent>;

  const ARS = 1;
  const USD = 2;

  function row(partial: Partial<SpendingRow>): SpendingRow {
    return {
      date: '2026-03-16T00:00:00', kind: 'Direct', sourceId: 1, categoryId: 5, categoryName: 'Viajes', parentName: null, detail: 'Algo', amount: 100,
      installmentNumber: null, installments: null, purchaseOwnTotal: null, purchaseDate: null,
      nativeAssetId: ARS, nativeAssetSymbol: '$', nativeAmount: 100, nativeGrossTotal: null, nativeOthersShare: null, nativeDiscounts: null,
      accountId: null, accountName: null, cardId: null, cardName: null,
      ...partial
    };
  }

  function render(rows: SpendingRow[], selectedAssetId: number | null = ARS, showDate = true): HTMLElement {
    fixture = TestBed.createComponent(SpendingRowsTableComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('selectedAssetId', selectedAssetId);
    fixture.componentRef.setInput('showDate', showDate);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ').trim();

  beforeEach(() => TestBed.configureTestingModule({ imports: [SpendingRowsTableComponent] }));

  it('una cuota dice cuál es y de cuántas, con la fecha de la compra y lo que costó (tu parte), y su tarjeta', () => {
    const el = render([row({
      kind: 'CardInstallment', detail: 'Vuelos Bariloche', amount: 175660.95, nativeAmount: 175660.95, installmentNumber: 2, installments: 6,
      purchaseOwnTotal: 1053965.7, purchaseDate: '2026-01-16T00:00:00', nativeGrossTotal: 1053965.7, cardName: 'Cabal Credicoop'
    })]);

    const t = text(el);
    expect(t).toContain('Vuelos Bariloche');
    expect(t).toContain('Cuota 2 de 6');
    expect(t).toContain('compra del 16/01/2026');
    expect(t).toContain('tu parte $ 1.053.965,70');
    expect(t).toContain('Cabal Credicoop');
    expect(t).toContain('$ 175.660,95');
  });

  it('un recurrente se rotula "recurrente" y dice su tarjeta', () => {
    const el = render([row({ kind: 'CardRecurring', detail: 'Swiss Medical', amount: 94340, nativeAmount: 94340, cardName: 'Visa Santander' })]);

    const t = text(el);
    expect(t).toContain('recurrente');
    expect(t).toContain('Visa Santander');
    expect(t).not.toContain('Cuota');
  });

  it('una compra compartida muestra el total, lo que pusieron otros y tu parte junto a lo que cuenta', () => {
    const el = render([row({
      kind: 'CardInstallment', detail: 'Cena con Redo y Violeta', amount: 44333.33, nativeAmount: 44333.33, installmentNumber: 1, installments: 1,
      nativeGrossTotal: 133000, nativeOthersShare: 88666.67, nativeDiscounts: 0, cardName: 'Visa Santander'
    })]);

    const t = text(el);
    expect(t).toContain('Compra con tarjeta');
    expect(t).toContain('total $ 133.000,00');
    expect(t).toContain('otros $ 88.666,67');
    expect(t).toContain('tu parte $ 44.333,33');
    expect(t).not.toContain('descuentos'); // sin descuento del banco no se nombra
  });

  it('un descuento del banco se nombra aparte de lo que pusieron otros', () => {
    const el = render([row({
      kind: 'CardInstallment', amount: 80000, nativeAmount: 80000, installmentNumber: 1, installments: 1,
      nativeGrossTotal: 100000, nativeOthersShare: 0, nativeDiscounts: 20000
    })]);

    const t = text(el);
    expect(t).toContain('descuentos $ 20.000,00');
    expect(t).not.toContain('otros');
  });

  it('un gasto en dólares visto en pesos muestra el convertido y, abajo, el original', () => {
    const el = render([row({ kind: 'CardRecurring', detail: 'Netflix', amount: 22500, nativeAmount: 15, nativeAssetId: USD, nativeAssetSymbol: 'US$', cardName: 'Visa' })], ARS);

    const t = text(el);
    expect(t).toContain('$ 22.500,00');
    expect(t).toContain('US$ 15,00');
  });

  it('un gasto en la moneda elegida no repite el original', () => {
    const el = render([row({ amount: 1500, nativeAmount: 1500, accountName: 'Santander' })], ARS);

    expect(text(el)).not.toContain('$ 1.500,00 $ 1.500,00');
    expect(el.querySelectorAll('.small.text-body-secondary').length).toBe(1); // solo la línea de detalle, no un segundo monto
  });

  it('un egreso directo dice su cuenta', () => {
    const el = render([row({ detail: 'Alquiler', accountName: 'Santander' })]);

    expect(text(el)).toContain('Santander');
  });

  it('al pie suma las filas, que es el número del bloque que se abrió', () => {
    const el = render([row({ amount: 1000.1 }), row({ amount: 500.2 }), row({ amount: 300.05 })]);

    expect(el.querySelector('[data-testid="spending-rows-total"]')!.textContent!.trim()).toBe('$ 1.800,35');
  });

  it('el panel de un día no muestra la columna de fecha', () => {
    const withDate = render([row({})], ARS, true);
    expect(withDate.querySelectorAll('thead th').length).toBe(4);

    const withoutDate = render([row({})], ARS, false);
    expect(withoutDate.querySelectorAll('thead th').length).toBe(3);
    expect(text(withoutDate)).not.toContain('16/03/2026');
  });
});
