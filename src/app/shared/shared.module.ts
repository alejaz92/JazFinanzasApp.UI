
import { NgModule } from '@angular/core'; 
import { CurrencyFiatFormatPipe } from './pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInputDirective } from './directives/currency-input.directive';
import { DecimalInputDirective } from './directives/decimal-input.directive';
import { CommerceTypePipe } from './pipes/commerceType/commerce-type.pipe';
import { CurrencyInvestmentFormatPipe } from './pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@NgModule({
    declarations: [CurrencyFiatFormatPipe, CurrencyInputDirective, DecimalInputDirective, CommerceTypePipe, CurrencyInvestmentFormatPipe],
    exports: [CurrencyFiatFormatPipe , CurrencyInputDirective, DecimalInputDirective, CommerceTypePipe, CurrencyInvestmentFormatPipe]
})
export class SharedModule { }