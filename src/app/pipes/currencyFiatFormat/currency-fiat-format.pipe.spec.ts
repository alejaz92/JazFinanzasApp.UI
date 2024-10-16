import { CurrencyFiatFormatPipe } from './currency-fiat-format.pipe';

describe('CurrencyFiatFormatPipe', () => {
  it('create an instance', () => {
    const pipe = new CurrencyFiatFormatPipe();
    expect(pipe).toBeTruthy();
  });
});
