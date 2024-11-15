
import { NgModule } from '@angular/core'; 
import { CurrencyFiatFormatPipe } from './pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInputDirective } from './directives/currency-input.directive';
import { DecimalInputDirective } from './directives/decimal-input.directive';
import { CommerceTypePipe } from './pipes/commerceType/commerce-type.pipe';
import { CurrencyInvestmentFormatPipe } from './pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { InvestmentInputDirective } from './directives/investment-input.directive';

@NgModule({
    declarations: 
    [
        CurrencyFiatFormatPipe, 
        CurrencyInputDirective, 
        DecimalInputDirective, 
        CommerceTypePipe, 
        CurrencyInvestmentFormatPipe,
        InvestmentInputDirective
    ],
    exports: 
    [
        CurrencyFiatFormatPipe , 
        CurrencyInputDirective, 
        DecimalInputDirective, 
        CommerceTypePipe, 
        CurrencyInvestmentFormatPipe,
        InvestmentInputDirective
    ]
})
export class SharedModule { }