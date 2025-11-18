export enum UserRole {
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profession?: string; // For professionals
  businessName?: string; // Nombre del negocio (Ej: Consultorio Dental Norte)
  slug?: string; // Identificador único URL (Ej: consultorio-norte)
  avatarUrl?: string;
}

export interface Service {
  id: string;
  professionalId: string;
  title: string;
  durationMinutes: number;
  price: number;
  description?: string;
  availabilityStart: string; // "08:00"
  availabilityEnd: string;   // "16:00"
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  professionalBusinessName?: string;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  date: string; // ISO YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AppointmentStatus;
  createdAt: number;
}

// Default fallbacks if needed, but services will override these
export const DEFAULT_START = "09:00";
export const DEFAULT_END = "18:00";