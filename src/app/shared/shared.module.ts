
import { NgModule } from '@angular/core'; 
import { CurrencyFiatFormatPipe } from './pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInputDirective } from './directives/currency-input.directive';
import { DecimalInputDirective } from './directives/decimal-input.directive';

@NgModule({
    declarations: [CurrencyFiatFormatPipe, CurrencyInputDirective, DecimalInputDirective],
    exports: [CurrencyFiatFormatPipe , CurrencyInputDirective, DecimalInputDirective]
})
export class SharedModule { }