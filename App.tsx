import React, { useState, useEffect } from 'react';
import { 
  Calendar, LogOut, Plus, Trash2, Clock, 
  CheckCircle, DollarSign, Briefcase, RefreshCw, X,
  Share2, MapPin, ExternalLink, ChevronLeft, Copy, Check
} from 'lucide-react';

import { User, UserRole, Service, Appointment, AppointmentStatus, DEFAULT_START, DEFAULT_END } from './types';
import { MOCK_USERS, MOCK_SERVICES, MOCK_APPOINTMENTS } from './services/mockData';
import { Button } from './components/Button';
import { Card, CardHeader, CardTitle, CardContent } from './components/Card';
import { formatCurrency, addMinutes, generateTimeSlots } from './utils';

// --- Mock "Database" Service Wrappers (Simulating Firebase) ---
const api = {
  login: async (email: string, role: UserRole): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = MOCK_USERS.find(u => u.email === email && u.role === role);
        if (existing) resolve(existing);
        else {
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email,
            role,
            profession: role === UserRole.PROFESSIONAL ? 'Nuevo Profesional' : undefined,
            businessName: role === UserRole.PROFESSIONAL ? 'Mi Negocio' : undefined,
            slug: role === UserRole.PROFESSIONAL ? `negocio-${Math.random().toString(36).substr(2, 5)}` : undefined,
            avatarUrl: `https://ui-avatars.com/api/?name=${email}&background=random`
          };
          resolve(newUser);
        }
      }, 800);
    });
  },
  getServices: async (proId: string): Promise<Service[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SERVICES.filter(s => s.professionalId === proId)), 500));
  },
  createService: async (service: Service): Promise<Service> => {
    return new Promise(resolve => {
      setTimeout(() => {
        MOCK_SERVICES.push(service);
        resolve(service);
      }, 500);
    });
  },
  deleteService: async (id: string): Promise<void> => {
    return new Promise(resolve => {
      const idx = MOCK_SERVICES.findIndex(s => s.id === id);
      if (idx > -1) MOCK_SERVICES.splice(idx, 1);
      setTimeout(resolve, 300);
    });
  },
  // Replaces "getProfessionals" for search. Now used just to simulate resolving a URL slug
  getProfessionalBySlug: async (slug: string): Promise<User | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_USERS.find(u => u.slug === slug || u.id === slug)), 400));
  },
  getAllProfessionals: async (): Promise<User[]> => {
    // Only for the demo "Quick Links" list
    return new Promise(resolve => setTimeout(() => resolve(MOCK_USERS.filter(u => u.role === UserRole.PROFESSIONAL)), 300));
  },
  getAppointments: async (userId: string, role: UserRole): Promise<Appointment[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const filtered = MOCK_APPOINTMENTS.filter(a => role === UserRole.PROFESSIONAL ? a.professionalId === userId : a.clientId === userId);
        filtered.sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime());
        resolve(filtered);
      }, 600);
    });
  },
  bookAppointment: async (appt: Appointment): Promise<Appointment> => {
    return new Promise(resolve => {
      setTimeout(() => {
        MOCK_APPOINTMENTS.push(appt);
        resolve(appt);
      }, 1000);
    });
  }
};

// --- Components ---

// Toast Notification Component
const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-[slideIn_0.3s_ease-out]">
      <div className="bg-green-500 rounded-full p-1"><Check size={14} className="text-white" /></div>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white ml-2"><X size={16} /></button>
    </div>
  );
};

const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const user = await api.login(email, role);
      onLogin(user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">TurnoFácil</h1>
          <p className="text-slate-500 mt-2">Plataforma de Gestión de Turnos</p>
        </div>

        <Card>
          <CardContent>
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.CLIENT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole(UserRole.CLIENT)}
              >
                Soy Cliente
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.PROFESSIONAL ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole(UserRole.PROFESSIONAL)}
              >
                Soy Profesional
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  placeholder={role === UserRole.PROFESSIONAL ? "ana@dentista.com" : "tu@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-xs">
                <p><strong>Demo Users:</strong><br/>Profesional: ana@dentista.com<br/>Cliente: martin@gmail.com</p>
              </div>
              <Button type="submit" className="w-full" isLoading={loading} size="lg">
                {loading ? 'Ingresando...' : `Ingresar como ${role === UserRole.PROFESSIONAL ? 'Profesional' : 'Cliente'}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Business Page Component (The "SaaS" Public View) ---
interface BusinessPageProps {
  professional: User;
  services: Service[];
  onBook: (service: Service) => void;
  onBack?: () => void;
}

const BusinessPage: React.FC<BusinessPageProps> = ({ professional, services, onBook, onBack }) => {
  return (
    <div className="animate-fadeIn">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4 pl-0">
          <ChevronLeft size={20} className="mr-1" /> Volver
        </Button>
      )}
      
      {/* Business Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-600"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-4">
            <img 
              src={professional.avatarUrl} 
              alt={professional.name} 
              className="w-24 h-24 rounded-xl border-4 border-white shadow-md bg-white object-cover"
            />
            <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{professional.businessName || professional.name}</h1>
              <p className="text-slate-500 font-medium">{professional.profession}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center text-slate-600 text-sm">
              <MapPin size={16} className="mr-2 text-brand-500" />
              <span>Consultorio Virtual, Buenos Aires</span>
            </div>
            <div className="flex items-center text-slate-600 text-sm">
              <Clock size={16} className="mr-2 text-brand-500" />
              <span>Horarios según servicio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">Servicios Disponibles</h2>
      <div className="grid gap-4">
        {services.map(service => (
          <Card key={service.id} className="hover:border-brand-400 transition-all group cursor-pointer" onClick={() => onBook(service)}>
            <CardContent className="flex justify-between items-center p-5">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-brand-700 transition-colors">{service.title}</h3>
                {service.description && <p className="text-slate-500 text-sm mb-2">{service.description}</p>}
                <div className="flex flex-wrap gap-3 items-center text-sm text-slate-400 mt-1">
                  <span className="flex items-center"><Clock size={14} className="mr-1" /> {service.durationMinutes} min</span>
                  <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded text-xs"><Clock size={12} className="mr-1" /> {service.availabilityStart} - {service.availabilityEnd}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xl font-bold text-slate-900 mb-2">{formatCurrency(service.price)}</span>
                <Button size="sm">Reservar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Google Calendar Sync State
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Service Form State
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({ 
    title: '', 
    duration: 30, 
    price: 0, 
    description: '',
    availabilityStart: '09:00',
    availabilityEnd: '18:00'
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    const [s, a] = await Promise.all([
      api.getServices(user.id),
      api.getAppointments(user.id, UserRole.PROFESSIONAL)
    ]);
    setServices(s);
    setAppointments(a);
  };

  const toggleGoogleSync = () => {
    if (isGoogleSynced) {
      if (confirm('¿Desconectar Google Calendar?')) {
        setIsGoogleSynced(false);
        setToastMessage('Google Calendar desconectado.');
      }
      return;
    }

    setIsSyncing(true);
    // Simulate API delay for Auth
    setTimeout(() => {
      setIsSyncing(false);
      setIsGoogleSynced(true);
      setToastMessage('¡Integración con Google Calendar habilitada!');
    }, 1500);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const s: Service = {
      id: Math.random().toString(36).substr(2, 9),
      professionalId: user.id,
      title: newService.title,
      durationMinutes: newService.duration,
      price: newService.price,
      description: newService.description,
      availabilityStart: newService.availabilityStart,
      availabilityEnd: newService.availabilityEnd
    };
    await api.createService(s);
    setServices([...services, s]);
    setShowServiceForm(false);
    setNewService({ title: '', duration: 30, price: 0, description: '', availabilityStart: '09:00', availabilityEnd: '18:00' });
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
    await api.deleteService(id);
    setServices(services.filter(s => s.id !== id));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://turnofacil.app/${user.slug}`);
    alert('Link copiado al portapapeles');
  };

  return (
    <div className="space-y-6 relative">
      <Toast message={toastMessage} isVisible={!!toastMessage} onClose={() => setToastMessage('')} />
      
      {/* Header & Link Share */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">{user.businessName}</h2>
              <p className="text-slate-400 text-sm">Panel de Control Profesional</p>
            </div>
            <div className="flex items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div className="mr-3 px-2 text-sm text-slate-300 font-mono hidden sm:block">
                turnofacil.app/{user.slug}
              </div>
              <Button size="sm" variant="primary" onClick={copyLink} icon={<Copy size={14} />}>
                Copiar Link
              </Button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Turnos Hoy</p>
              <p className="text-3xl font-bold">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
            </div>
            <Clock className="w-10 h-10 text-brand-500 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Ingresos Mes</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(appointments.reduce((acc, curr) => acc + curr.servicePrice, 0))}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
          </CardContent>
        </Card>
        
        <Card 
          onClick={!isSyncing ? toggleGoogleSync : undefined}
          className={`border-2 transition-all cursor-pointer shadow-none flex items-center justify-center group relative overflow-hidden
            ${isGoogleSynced 
              ? 'border-green-500 bg-green-50' 
              : 'border-dashed border-slate-300 bg-transparent hover:bg-slate-50 hover:border-slate-400'
            }`}
        >
           <div className="text-center py-2 relative z-10">
              {isSyncing ? (
                <>
                   <svg className="animate-spin mx-auto h-6 w-6 text-brand-600 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span className="text-sm font-medium text-brand-600">Conectando...</span>
                </>
              ) : isGoogleSynced ? (
                <>
                  <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-1" />
                  <span className="text-sm font-bold text-green-700">Sincronizado con Google</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6 mx-auto text-slate-400 mb-1 group-hover:text-brand-500 transition-colors" />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700">Sincronizar Google Calendar</span>
                </>
              )}
           </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Mi Agenda
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'services' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Mis Servicios
        </button>
      </div>

      {/* Content */}
      {activeTab === 'appointments' ? (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No tienes turnos programados aún.</p>
            </div>
          ) : (
            appointments.map(appt => (
              <Card key={appt.id}>
                <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium uppercase tracking-wide">{appt.status}</span>
                      <span className="text-sm text-slate-400">{appt.date}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">{appt.serviceTitle}</h4>
                    <p className="text-slate-500 text-sm">Cliente: <span className="font-medium text-slate-700">{appt.clientName}</span></p>
                  </div>
                  <div className="flex items-center gap-4 md:justify-end w-full md:w-auto">
                    <div className="text-right mr-2">
                      <p className="text-lg font-bold text-slate-900">{appt.startTime} hs</p>
                      <p className="text-xs text-slate-500">hasta {appt.endTime}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://wa.me/?text=Hola ${appt.clientName}, te escribo por tu turno...`, '_blank')}
                      icon={<Share2 size={16} />}
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900">Catálogo de Servicios</h3>
            <Button onClick={() => setShowServiceForm(true)} icon={<Plus size={18} />}>Nuevo Servicio</Button>
          </div>
          
          {showServiceForm && (
            <Card className="bg-slate-50 border-brand-200 animate-fadeIn">
              <CardContent>
                <form onSubmit={handleCreateService} className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                    <input required type="text" className="w-full p-2 border rounded-md" placeholder="Ej: Consulta Inicial" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Descripción corta</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Detalles del servicio..." value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Duración (min)</label>
                        <select className="w-full p-2 border rounded-md" value={newService.duration} onChange={e => setNewService({...newService, duration: Number(e.target.value)})}>
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Precio (ARS)</label>
                        <input required type="number" className="w-full p-2 border rounded-md" placeholder="0" value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})} />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded-md border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Banda Horaria del Servicio</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Hora Inicio</label>
                        <input 
                          type="time" 
                          required
                          className="w-full p-2 border rounded-md text-sm" 
                          value={newService.availabilityStart} 
                          onChange={e => setNewService({...newService, availabilityStart: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Hora Fin</label>
                        <input 
                          type="time" 
                          required
                          className="w-full p-2 border rounded-md text-sm" 
                          value={newService.availabilityEnd} 
                          onChange={e => setNewService({...newService, availabilityEnd: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1">Guardar</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowServiceForm(false)}><X size={18} /></Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <Card key={service.id} className="hover:border-brand-300 transition-colors group">
                <CardContent>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900 group-hover:text-brand-600">{service.title}</h4>
                    <button onClick={() => handleDeleteService(service.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{service.description || 'Sin descripción.'}</p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 flex items-center"><Clock size={12} className="mr-1"/> {service.durationMinutes} min</span>
                        <span className="text-base font-bold text-brand-600">{formatCurrency(service.price)}</span>
                     </div>
                     <div className="text-xs text-slate-400 bg-slate-50 p-1.5 rounded text-center">
                        Horario: {service.availabilityStart} - {service.availabilityEnd}
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ClientDashboard: React.FC<{ user: User }> = ({ user }) => {
  // Views: 'list' (My appointments) | 'business' (Viewing a specific business page) | 'booking' (Wizard)
  const [viewState, setViewState] = useState<'list' | 'business' | 'booking'>('list');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [allProsForDemo, setAllProsForDemo] = useState<User[]>([]);
  
  // Selected Context
  const [selectedPro, setSelectedPro] = useState<User | null>(null);
  const [proServices, setProServices] = useState<Service[]>([]);
  
  // Booking Wizard
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadDemoLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointments = async () => {
    const a = await api.getAppointments(user.id, UserRole.CLIENT);
    setMyAppointments(a);
  };

  const loadDemoLinks = async () => {
    const p = await api.getAllProfessionals();
    setAllProsForDemo(p);
  };

  // --- Flow: Visit Business Page ---
  const visitBusiness = async (pro: User) => {
    setSelectedPro(pro);
    const services = await api.getServices(pro.id);
    setProServices(services);
    setViewState('business');
    // Reset booking state
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setIsBookingSuccess(false);
  };

  const startBookingService = (service: Service) => {
    setSelectedService(service);
    // Default tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    setViewState('booking');
  };

  // --- Booking Logic ---
  useEffect(() => {
    if (viewState === 'booking' && selectedDate && selectedPro && selectedService) {
      calculateSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewState]);

  const calculateSlots = async () => {
    if (!selectedPro || !selectedService) return;
    const allAppts = await api.getAppointments(selectedPro.id, UserRole.PROFESSIONAL);
    const dayAppts = allAppts.filter(a => a.date === selectedDate);
    
    // Use service specific hours, fallback to defaults if missing
    const start = selectedService.availabilityStart || DEFAULT_START;
    const end = selectedService.availabilityEnd || DEFAULT_END;

    const slots = generateTimeSlots(
      selectedService.durationMinutes, 
      dayAppts.map(a => ({ start: a.startTime, end: a.endTime })),
      start,
      end
    );
    setAvailableSlots(slots);
  };

  const confirmBooking = async () => {
    if (!selectedPro || !selectedService || !selectedDate || !selectedTime) return;
    setIsBooking(true);
    
    const newAppt: Appointment = {
      id: 'appt-' + Date.now(),
      clientId: user.id,
      clientName: user.name,
      professionalId: selectedPro.id,
      professionalName: selectedPro.name,
      professionalBusinessName: selectedPro.businessName,
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      servicePrice: selectedService.price,
      date: selectedDate,
      startTime: selectedTime,
      endTime: addMinutes(selectedTime, selectedService.durationMinutes),
      status: AppointmentStatus.CONFIRMED,
      createdAt: Date.now()
    };

    await api.bookAppointment(newAppt);
    setIsBooking(false);
    setIsBookingSuccess(true);
    await loadAppointments(); // Refresh list
  };

  // --- Render: Booking Wizard ---
  if (viewState === 'booking' && selectedPro && selectedService) {
    if (isBookingSuccess) {
      return (
        <div className="max-w-xl mx-auto text-center py-12 animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Turno Confirmado!</h2>
          <p className="text-slate-500 mb-8 text-lg">
            Te esperamos en <strong>{selectedPro.businessName}</strong> el día {new Date(selectedDate).toLocaleDateString()} a las {selectedTime}.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setViewState('list')} variant="outline">Ir a Mis Turnos</Button>
            <Button onClick={() => setViewState('business')}>Volver a la Página del Negocio</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <Button variant="ghost" onClick={() => setViewState('business')} className="mb-4 pl-0">
          <ChevronLeft size={20} className="mr-1" /> Volver a {selectedPro.businessName}
        </Button>
        
        <Card>
           <CardHeader className="bg-slate-50 border-b border-slate-100">
             <h2 className="text-xl font-bold text-slate-900">Finalizar Reserva</h2>
             <p className="text-sm text-slate-500">{selectedService.title} con {selectedPro.name}</p>
           </CardHeader>
           <CardContent className="space-y-6 pt-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha del turno</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Slots */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Horarios Disponibles ({selectedService.availabilityStart} - {selectedService.availabilityEnd})</label>
                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-700 rounded-lg text-sm">
                    No hay turnos disponibles para esta fecha. Por favor selecciona otra.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 text-sm font-medium rounded-md transition-all ${
                          selectedTime === time 
                            ? 'bg-brand-600 text-white ring-2 ring-offset-1 ring-brand-600' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div>
                  <p className="text-sm text-slate-500">Precio Final</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedService.price)}</p>
                </div>
                <Button disabled={!selectedTime} onClick={confirmBooking} isLoading={isBooking} size="lg">
                  Confirmar Turno
                </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  // --- Render: Business Page (The "Site") ---
  if (viewState === 'business' && selectedPro) {
    return (
      <BusinessPage 
        professional={selectedPro} 
        services={proServices} 
        onBook={startBookingService} 
        onBack={() => setViewState('list')} 
      />
    );
  }

  // --- Render: My Appointments (Home) ---
  return (
    <div className="space-y-8">
      {/* Demo "Quick Links" to simulate clicking a URL */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink size={16} className="text-brand-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Simular visita por enlace (Demo)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {allProsForDemo.map(pro => (
             <button 
                key={pro.id}
                onClick={() => visitBusiness(pro)}
                className="flex items-center p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all text-left"
             >
                <img src={pro.avatarUrl} className="w-8 h-8 rounded-full mr-3" alt="" />
                <div>
                  <p className="text-sm font-medium text-brand-700 hover:underline">ir a: turnofacil.app/{pro.slug}</p>
                  <p className="text-xs text-slate-500">{pro.businessName}</p>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Mis Turnos</h2>
      </div>

      {myAppointments.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">Sin turnos programados</h3>
          <p className="text-slate-500 mb-6">Utiliza los enlaces de arriba para visitar un negocio y reservar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myAppointments.map(appt => (
            <Card key={appt.id}>
              <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase">Confirmado</span>
                      <span className="text-sm text-slate-500">{new Date(appt.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{appt.serviceTitle}</h3>
                  <p className="text-brand-600 text-sm font-medium mt-1">{appt.professionalBusinessName || appt.professionalName}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{appt.startTime}</p>
                    <p className="text-xs text-slate-400">Duración aprox.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://wa.me/?text=Hola, soy ${appt.clientName}. Te contacto por el turno del ${appt.date}.`, '_blank')}
                    icon={<Share2 size={16} className="text-green-600" />}
                  >
                    Contacto
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('turnofacil_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('turnofacil_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('turnofacil_user');
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-brand-600 text-white p-1.5 rounded-lg mr-2">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">TurnoFácil</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-500">{user.role === UserRole.PROFESSIONAL ? 'Profesional' : 'Cliente'}</span>
              </div>
              <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200" />
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-50 rounded-full">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === UserRole.PROFESSIONAL ? (
          <ProDashboard user={user} />
        ) : (
          <ClientDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default App;