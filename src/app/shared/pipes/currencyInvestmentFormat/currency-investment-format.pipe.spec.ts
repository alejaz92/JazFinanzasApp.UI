import { CurrencyInvestmentFormatPipe } from './currency-investment-format.pipe';

describe('CurrencyInvestmentFormatPipe', () => {
  let pipe: CurrencyInvestmentFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyInvestmentFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('sin forzar decimales, recorta a 0 decimales a partir de los miles (cantidades de inversión)', () => {
    expect(pipe.transform(1320868.64)).toBe('1.320.869');
    expect(pipe.transform(1500)).toBe('1.500');
  });

  it('sin forzar decimales, mantiene decimales (sin ceros finales) por debajo de los miles', () => {
    expect(pipe.transform(123.4)).toBe('123,4');
    expect(pipe.transform(0.000123)).toBe('0,000123');
  });

  it('forzando dos decimales, los mantiene incluso arriba de los miles (saldos de Moneda)', () => {
    expect(pipe.transform(1320868.64, true)).toBe('1.320.868,64');
    expect(pipe.transform(1500, true)).toBe('1.500,00');
    expect(pipe.transform(-1320868.64, true)).toBe('-1.320.868,64');
  });
});
