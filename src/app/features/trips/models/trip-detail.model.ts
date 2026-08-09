import { Trip } from './trip.model';
import { TripMovement } from './trip-movement.model';
import { TripLinkedEvent } from './trip-linked-event.model';

export interface TripDetail extends Trip {
    movements: TripMovement[];
    linkedEvents: TripLinkedEvent[];

    // Las dos lecturas del viaje (Fase 2), en la moneda de referencia principal del usuario.
    ownTotal: number;
    grossTotal: number;
}
