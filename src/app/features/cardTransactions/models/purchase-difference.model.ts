// plan-repartos-y-descuentos-faltantes.md (D3, D4, D5): qué fue la diferencia entre el valor de la cuota de una compra con tarjeta y lo que se pagó.

// `PriceChange` es solo de una suscripción al pagar el resumen: el precio nuevo rige desde ese mes (Fase 15).
export type PurchaseDifferenceKind = 'Discount' | 'People' | 'FixTotal' | 'PriceChange';

export interface PurchaseDifferencePerson {
    personId: number;
    amount: number;
}

// Lo que viaja al backend (`CardPurchaseDifferenceDTO`): en el pago del resumen va dentro de la fila de la cuota; en la pantalla de compras que no
// cierran, como cuerpo de `POST api/CardTransaction/{id}/difference`.
export interface PurchaseDifference {
    kind: PurchaseDifferenceKind;
    people?: PurchaseDifferencePerson[];
}

// Lo que se le muestra al usuario en el diálogo.
export interface PurchaseDifferenceContext {
    // La compra: su detalle y, si tiene cuotas, qué cuota es ("2/6").
    detail: string;
    // Opcionales: la pantalla de compras que no cierran habla de toda la compra y no de una cuota, así que pone su propio título y su propio texto
    // (con la diferencia incluida). Sin ellos se usan los del formulario de pago.
    title?: string;
    summary?: string;
    installmentLabel?: string;
    // Cuota menos lo pagado, con signo y en la moneda de la compra: positiva si se pagó de menos, negativa si se pagó de más.
    difference: number;
    // "$" o "US$".
    symbol: string;
    // Corregir el total solo tiene sentido cuando se pagó de más en una compra de una sola cuota.
    allowFixTotal: boolean;
    // "Es un error" vuelve la cuota a su valor: solo en el formulario de pago, donde la cuota se está editando.
    allowRevert: boolean;
    // Hay que contestar: sin "Cancelar", sin la X y sin cerrar con Escape o haciendo clic afuera (el pago del resumen).
    required?: boolean;
    // La cuota es de una suscripción: se ofrecen el descuento del mes, el cambio de precio y "solo por esta vez".
    recurring?: boolean;
    // Lo que se paga: el precio nuevo que quedaría en una suscripción.
    paidAmount?: number;
}

// Lo que el usuario eligió en el diálogo. `Later` es cerrarlo sin elegir (solo cuando no es obligatorio): no se carga nada. `ThisTimeOnly` es "es solo
// por esta vez": una suscripción se paga por ese monto y no se carga nada. `Revert` es "es un error": la cuota vuelve a su valor.
export type PurchaseDifferenceChoice =
    | { kind: 'Discount' }
    | { kind: 'People'; people: PurchaseDifferencePerson[] }
    | { kind: 'FixTotal' }
    | { kind: 'PriceChange' }
    | { kind: 'ThisTimeOnly' }
    | { kind: 'Later' }
    | { kind: 'Revert' };

// Cuánto puede diferir lo que suman las personas de la diferencia (igual que el backend).
export const DIFFERENCE_SUM_TOLERANCE = 0.01;

// A partir de cuánto una cuota pagada por otro monto cuenta como una diferencia a explicar: ARS 1 en pesos y centavos en dólares (plan, D-4).
export function differenceThreshold(symbol: string): number {
    return symbol === '$' ? 1 : 0.01;
}
