import { TripType } from './trip.model';

export interface TripRequest {
    name: string;
    type: TripType;
    startDate: string;
    endDate: string;
}
