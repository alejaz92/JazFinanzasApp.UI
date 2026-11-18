// plan-repartos-y-descuentos-faltantes.md (D3, D4, D5): qué fue la diferencia entre el valor de la cuota de una compra con tarjeta y lo que se pagó.

export type PurchaseDifferenceKind = 'Discount' | 'People' | 'FixTotal';

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
    installmentLabel?: string;
    // Cuota menos lo pagado, con signo y en la moneda de la compra: positiva si se pagó de menos, negativa si se pagó de más.
    difference: number;
    // "$" o "US$".
    symbol: string;
    // Corregir el total solo tiene sentido cuando se pagó de más en una compra de una sola cuota.
    allowFixTotal: boolean;
    // "Es un error" vuelve la cuota a su valor: solo en el formulario de pago, donde la cuota se está editando.
    allowRevert: boolean;
}

// Lo que el usuario eligió en el diálogo. `Later` es "lo veo después" (o cerrar el diálogo): no se carga nada y la compra queda en la lista de las
// que no cierran. `Revert` es "es un error": la cuota vuelve a su valor.
export type PurchaseDifferenceChoice =
    | { kind: 'Discount' }
    | { kind: 'People'; people: PurchaseDifferencePerson[] }
    | { kind: 'FixTotal' }
    | { kind: 'Later' }
    | { kind: 'Revert' };

// Cuánto puede diferir lo que suman las personas de la diferencia (igual que el backend).
export const DIFFERENCE_SUM_TOLERANCE = 0.01;

// A partir de cuánto una cuota pagada por otro monto cuenta como una diferencia a explicar: ARS 1 en pesos y centavos en dólares (plan, D-4).
export function differenceThreshold(symbol: string): number {
    return symbol === '$' ? 1 : 0.01;
}
