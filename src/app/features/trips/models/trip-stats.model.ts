import { TripStatus, TripType } from './trip.model';

export interface TripGeneralStats {
    tripId: number;
    name: string;
    type: TripType;
    startDate: string;
    endDate: string;
    status: TripStatus;
    totalInReference: number;
}

export interface TripClassBreakdown {
    transactionClass: string;
    amount: number;
}

export interface TripDetailStats {
    tripId: number;
    name: string;
    total: number;
    breakdown: TripClassBreakdown[];
}
