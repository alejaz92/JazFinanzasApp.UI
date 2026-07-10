export type TripType = 'DOMESTIC' | 'INTERNATIONAL';
export type TripStatus = 'PLANNED' | 'IN_PROGRESS' | 'FINISHED';

export interface Trip {
    id: number;
    name: string;
    type: TripType;
    startDate: string;
    endDate: string;
    status: TripStatus;
}
