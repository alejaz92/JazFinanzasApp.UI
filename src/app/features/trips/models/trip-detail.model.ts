import { Trip } from './trip.model';
import { TripMovement } from './trip-movement.model';

export interface TripDetail extends Trip {
    movements: TripMovement[];
}
