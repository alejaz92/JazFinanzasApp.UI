// plan-repartos-y-descuentos-faltantes.md (D6, Fase 8): una compra con tarjeta que no cierra — lo que se dejó de pagar de sus cuotas no coincide con lo que
// explican su reparto y sus descuentos. Es lo que devuelve `GET api/CardTransaction/mismatches`; todo en la moneda de la compra.

export interface CardPurchaseMismatchPayment {
    // La transacción de la cuota pagada: se edita en /transactions/:id.
    transactionId: number;
    date: string;
    amount: number;
}

export interface CardPurchaseMismatch {
    cardTransactionId: number;
    date: string;
    detail: string;
    cardId: number;
    cardName: string;
    assetId: number;
    // "ARS" o "USD".
    assetSymbol: string;
    totalAmount: number;
    installments: number;
    installmentAmount: number;
    paidInstallments: number;
    // Lo pagado en las cuotas pagadas y lo que explican el reparto y los descuentos de la compra.
    paid: number;
    explained: number;
    // "Underpaid": se pagó de menos y ningún reparto ni descuento lo explica. "Overpaid": todas las cuotas están pagadas y hay más reparto o descuento
    // cargado que lo que se dejó de pagar.
    direction: 'Underpaid' | 'Overpaid';
    // Cuánto no cierra, siempre positivo.
    difference: number;
    // Las cuotas pagadas, de la más vieja a la más nueva.
    payments: CardPurchaseMismatchPayment[];
}
