export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ShowBrief {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  price: string | number;
  availableSeatsCount?: number;
  totalSeats?: number;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  language?: string;
  rating?: string;
  posterUrl?: string | null;
  isActive: boolean;
  shows?: ShowBrief[];
}

export interface SeatInfo {
  showSeatId: string;
  seatId: string;
  row: string;
  number: number;
  status: 'AVAILABLE' | 'HELD' | 'HELD_BY_YOU' | 'BOOKED';
  holdExpiresInSeconds: number | null;
}

export interface ShowDetail {
  id: string;
  movieId: string;
  movieTitle: string;
  startTime: string;
  endTime: string;
  price: string | number;
}

export interface BookingReceipt {
  id: string;
  movieTitle: string;
  screenName: string;
  startTime: string;
  totalAmount: string | number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  holdExpiresAt: string;
  seats: string[];
  paymentStatus: string;
  createdAt: string;
}
