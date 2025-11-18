import { User, UserRole, Service, Appointment, AppointmentStatus } from '../types';

// Initial Mock Data to make the app usable immediately without backend
export const MOCK_USERS: User[] = [
  {
    id: 'pro-1',
    name: 'Dra. Ana Gómez',
    email: 'ana@dentista.com',
    role: UserRole.PROFESSIONAL,
    profession: 'Odontóloga',
    businessName: 'Clínica Sonrisas',
    slug: 'clinica-sonrisas',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'pro-2',
    name: 'Lic. Carlos Ruiz',
    email: 'carlos@psico.com',
    role: UserRole.PROFESSIONAL,
    profession: 'Psicólogo Clínico',
    businessName: 'Espacio Terapéutico Ruiz',
    slug: 'espacio-ruiz',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'client-1',
    name: 'Martin Perez',
    email: 'martin@gmail.com',
    role: UserRole.CLIENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Martin+Perez&background=random'
  }
];

export const MOCK_SERVICES: Service[] = [
  {
    id: 'srv-1',
    professionalId: 'pro-1',
    title: 'Limpieza Dental Profunda',
    durationMinutes: 30,
    price: 25000,
    description: 'Limpieza completa con ultrasonido y flúor.',
    availabilityStart: '09:00',
    availabilityEnd: '17:00'
  },
  {
    id: 'srv-2',
    professionalId: 'pro-1',
    title: 'Blanqueamiento',
    durationMinutes: 60,
    price: 80000,
    description: 'Sesión láser para blanqueamiento instantáneo.',
    availabilityStart: '10:00',
    availabilityEnd: '19:00'
  },
  {
    id: 'srv-3',
    professionalId: 'pro-2',
    title: 'Sesión Terapia Individual',
    durationMinutes: 50,
    price: 30000,
    description: 'Terapia cognitivo-conductual.',
    availabilityStart: '14:00',
    availabilityEnd: '20:00'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    clientId: 'client-1',
    clientName: 'Martin Perez',
    professionalId: 'pro-1',
    professionalName: 'Dra. Ana Gómez',
    professionalBusinessName: 'Clínica Sonrisas',
    serviceId: 'srv-1',
    serviceTitle: 'Limpieza Dental Profunda',
    servicePrice: 25000,
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.CONFIRMED,
    createdAt: Date.now()
  }
];