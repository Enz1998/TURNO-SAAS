import React, { useState, useEffect } from 'react';
import { 
  Calendar, LogOut, Plus, Trash2, Clock, 
  CheckCircle, DollarSign, Briefcase, RefreshCw, X,
  Share2, MapPin, ExternalLink, ChevronLeft, Copy, Check,
  Settings, User as UserIcon, ArrowRight, Star
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
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-slideIn">
      <div className="bg-green-500 rounded-full p-1"><Check size={14} className="text-white" /></div>
      <span className="font-medium text-sm tracking-tight">{message}</span>
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-glow mb-6">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Bienvenido a TurnoFácil
        </h2>
        <p className="text-slate-500 text-lg mb-8">
          Gestión de turnos inteligente para <span className="text-brand-600 font-semibold">profesionales modernos</span>.
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <Card>
          <CardContent className="space-y-6 p-8">
            <div className="bg-slate-50 p-1.5 rounded-xl flex gap-1 border border-slate-100">
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === UserRole.CLIENT ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole(UserRole.CLIENT)}
              >
                Soy Cliente
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === UserRole.PROFESSIONAL ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole(UserRole.PROFESSIONAL)}
              >
                Soy Profesional
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  className="block w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all duration-200 outline-none"
                  placeholder={role === UserRole.PROFESSIONAL ? "ana@dentista.com" : "tu@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="bg-blue-50/50 border border-blue-100 text-blue-700 p-4 rounded-lg text-xs leading-relaxed">
                <p className="font-semibold mb-1">⚡️ Acceso Demo Rápido:</p>
                <p>Profesional: <span className="font-mono bg-blue-100 px-1 rounded">ana@dentista.com</span></p>
                <p>Cliente: <span className="font-mono bg-blue-100 px-1 rounded">martin@gmail.com</span></p>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                {loading ? 'Conectando...' : `Ingresar como ${role === UserRole.PROFESSIONAL ? 'Profesional' : 'Cliente'}`}
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
    <div className="animate-fadeIn max-w-3xl mx-auto pt-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 text-slate-500 hover:text-slate-800">
          <ChevronLeft size={20} className="mr-1" /> Volver
        </Button>
      )}
      
      {/* Business Header */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-brand-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <img 
            src={professional.avatarUrl} 
            alt={professional.name} 
            className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover mx-auto"
          />
          <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{professional.businessName || professional.name}</h1>
        <p className="text-lg text-slate-500 font-medium mb-4">{professional.profession}</p>
        
        <div className="flex justify-center items-center gap-6 text-sm text-slate-500">
          <span className="flex items-center bg-slate-100 px-3 py-1 rounded-full"><MapPin size={14} className="mr-1.5 text-brand-600" /> Buenos Aires</span>
          <span className="flex items-center bg-slate-100 px-3 py-1 rounded-full"><Star size={14} className="mr-1.5 text-brand-600" /> 4.9 (120+ Reseñas)</span>
        </div>
      </div>

      {/* Services List */}
      <h2 className="text-xl font-bold text-slate-900 mb-6 px-1">Selecciona un Servicio</h2>
      <div className="grid gap-5">
        {services.map(service => (
          <div 
            key={service.id} 
            className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => onBook(service)}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors">{service.title}</h3>
                {service.description && <p className="text-slate-500 text-sm mt-1 mb-3 max-w-md">{service.description}</p>}
                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <span className="flex items-center text-slate-600 font-medium"><Clock size={14} className="mr-1.5 text-brand-500" /> {service.durationMinutes} min</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-slate-500">{service.availabilityStart} - {service.availabilityEnd}</span>
                </div>
              </div>
              <div className="text-right pl-4">
                <span className="block text-xl font-bold text-slate-900 mb-3">{formatCurrency(service.price)}</span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors ml-auto">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
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
    setToastMessage('Link copiado al portapapeles');
  };

  return (
    <div className="space-y-8 relative">
      <Toast message={toastMessage} isVisible={!!toastMessage} onClose={() => setToastMessage('')} />
      
      {/* Header & Link Share */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>
         
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <img src={user.avatarUrl} className="w-16 h-16 rounded-full border-2 border-white/20" alt={user.name} />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{user.businessName}</h2>
                <p className="text-slate-400">Panel de Control Profesional</p>
              </div>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm p-2 pl-4 rounded-xl border border-white/10 hover:bg-white/15 transition-colors w-full md:w-auto justify-between md:justify-start">
              <div className="mr-4 text-sm text-brand-100 font-mono truncate max-w-[150px] sm:max-w-none">
                turnofacil.app/{user.slug}
              </div>
              <Button size="sm" variant="primary" onClick={copyLink} icon={<Copy size={14} />}>
                Copiar
              </Button>
            </div>
         </div>
      </div>

      {/* Metrics & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Turnos Hoy</p>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
            </div>
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Ingresos Mes</p>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(appointments.reduce((acc, curr) => acc + curr.servicePrice, 0))}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <div 
          onClick={!isSyncing ? toggleGoogleSync : undefined}
          className={`rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 h-full
            ${isGoogleSynced 
              ? 'border-green-500/30 bg-green-50/50' 
              : 'border-dashed border-slate-300 bg-transparent hover:bg-slate-50 hover:border-brand-300'
            }`}
        >
            {isSyncing ? (
              <>
                  <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-semibold text-brand-600">Conectando...</span>
              </>
            ) : isGoogleSynced ? (
              <>
                <div className="bg-green-100 p-2 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                <span className="text-sm font-bold text-green-700">Google Calendar Activo</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-bold text-slate-500">Sincronizar Google Calendar</span>
              </>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'appointments' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Mi Agenda
          {activeTab === 'appointments' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'services' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Mis Servicios
          {activeTab === 'services' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-full"></span>}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'appointments' ? (
        <div className="space-y-5">
          {appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-soft">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 font-medium">Tu agenda está libre por ahora.</p>
            </div>
          ) : (
            appointments.map(appt => (
              <Card key={appt.id} className="group hover:border-brand-200">
                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 text-xs rounded-full font-bold uppercase tracking-wider">{appt.status}</span>
                      <span className="text-sm font-medium text-slate-400">{new Date(appt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">{appt.serviceTitle}</h4>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                      <UserIcon size={16} /> {appt.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 md:justify-end w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 tracking-tight">{appt.startTime}</p>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Horario Fin: {appt.endTime}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://wa.me/?text=Hola ${appt.clientName}, te escribo por tu turno...`, '_blank')}
                      icon={<Share2 size={16} />}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Catálogo de Servicios</h3>
            <Button onClick={() => setShowServiceForm(true)} icon={<Plus size={18} />} size="md">Crear Servicio</Button>
          </div>
          
          {showServiceForm && (
            <Card className="bg-slate-50 border-brand-200 animate-fadeIn relative overflow-hidden">
              <CardContent>
                <div className="mb-6 flex justify-between items-center">
                  <h4 className="font-bold text-lg text-slate-800">Nuevo Servicio</h4>
                  <button onClick={() => setShowServiceForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateService} className="grid grid-cols-1 gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre del Servicio</label>
                      <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ej: Consulta Inicial" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Precio (ARS)</label>
                      <input required type="number" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="0" value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descripción</label>
                    <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none h-20" placeholder="¿Qué incluye este servicio?" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-brand-500" />
                      <label className="text-sm font-bold text-slate-800">Duración y Horarios</label>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                       <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Duración</label>
                          <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-brand-500" value={newService.duration} onChange={e => setNewService({...newService, duration: Number(e.target.value)})}>
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                            <option value="90">90 min</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Inicio Jornada</label>
                          <input type="time" required className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-brand-500" value={newService.availabilityStart} onChange={e => setNewService({...newService, availabilityStart: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Fin Jornada</label>
                          <input type="time" required className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-brand-500" value={newService.availabilityEnd} onChange={e => setNewService({...newService, availabilityEnd: e.target.value})} />
                       </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setShowServiceForm(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Servicio</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map(service => (
              <div key={service.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft hover:shadow-lg transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{service.title}</h4>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(service.price)}</p>
                  </div>
                  <button onClick={() => handleDeleteService(service.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">{service.description || 'Sin descripción.'}</p>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl">
                   <span className="flex items-center"><Clock size={14} className="mr-1.5 text-brand-500"/> {service.durationMinutes} min</span>
                   <div className="w-px h-4 bg-slate-200"></div>
                   <span>{service.availabilityStart} - {service.availabilityEnd}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ClientDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [viewState, setViewState] = useState<'list' | 'business' | 'booking'>('list');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [allProsForDemo, setAllProsForDemo] = useState<User[]>([]);
  const [selectedPro, setSelectedPro] = useState<User | null>(null);
  const [proServices, setProServices] = useState<Service[]>([]);
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

  const visitBusiness = async (pro: User) => {
    setSelectedPro(pro);
    const services = await api.getServices(pro.id);
    setProServices(services);
    setViewState('business');
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setIsBookingSuccess(false);
  };

  const startBookingService = (service: Service) => {
    setSelectedService(service);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    setViewState('booking');
  };

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
    await loadAppointments();
  };

  if (viewState === 'booking' && selectedPro && selectedService) {
    if (isBookingSuccess) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 animate-fadeIn">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">¡Turno Confirmado!</h2>
          <p className="text-slate-500 mb-10 text-xl">
            Te esperamos en <span className="font-semibold text-slate-900">{selectedPro.businessName}</span><br/>
            el día {new Date(selectedDate).toLocaleDateString()} a las {selectedTime}.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setViewState('list')} variant="outline" size="lg">Ir a Mis Turnos</Button>
            <Button onClick={() => setViewState('business')} size="lg">Volver al Negocio</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-fadeIn pt-6">
        <Button variant="ghost" onClick={() => setViewState('business')} className="mb-6 pl-0 text-slate-500">
          <ChevronLeft size={20} className="mr-1" /> Volver a {selectedPro.businessName}
        </Button>
        
        <Card className="overflow-hidden border-0 shadow-2xl shadow-slate-200/50">
           <div className="bg-slate-900 p-8 text-white">
             <h2 className="text-2xl font-bold tracking-tight">Finalizar Reserva</h2>
             <div className="flex items-center mt-2 text-slate-300">
               <span className="font-medium text-white mr-2">{selectedService.title}</span>
               <span className="w-1 h-1 bg-slate-500 rounded-full mx-2"></span>
               <span>{formatCurrency(selectedService.price)}</span>
             </div>
           </div>
           <CardContent className="space-y-8 p-8">
              <div>
                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">1. Fecha del turno</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">2. Horarios Disponibles</label>
                {availableSlots.length === 0 ? (
                  <div className="p-6 bg-amber-50 text-amber-800 rounded-xl text-center font-medium border border-amber-100">
                    Selecciona una fecha para ver los horarios disponibles.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                          selectedTime === time 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 transform scale-105' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(selectedService.price)}</p>
                </div>
                <Button disabled={!selectedTime} onClick={confirmBooking} isLoading={isBooking} size="lg" className="px-10">
                  Confirmar
                </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="space-y-10">
      {/* Demo "Quick Links" */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl shadow-slate-900/10 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="bg-white/10 p-2 rounded-lg"><ExternalLink size={20} className="text-white" /></div>
          <div>
             <h3 className="text-lg font-bold tracking-tight">Explorar Negocios (Demo)</h3>
             <p className="text-slate-400 text-sm">Simula que haces click en el link de un profesional.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
           {allProsForDemo.map(pro => (
             <button 
                key={pro.id}
                onClick={() => visitBusiness(pro)}
                className="flex items-center p-3 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/20 transition-all text-left group"
             >
                <img src={pro.avatarUrl} className="w-10 h-10 rounded-full mr-4 border border-white/10" alt="" />
                <div>
                  <p className="font-bold text-white group-hover:text-brand-300 transition-colors">turnofacil.app/{pro.slug}</p>
                  <p className="text-xs text-slate-400">{pro.businessName}</p>
                </div>
                <ArrowRight size={16} className="ml-auto text-slate-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
             </button>
           ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">Mis Próximos Turnos</h2>
        {myAppointments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-soft">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No tienes turnos</h3>
            <p className="text-slate-500 max-w-md mx-auto">Explora los negocios de arriba para reservar tu primer turno.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {myAppointments.map(appt => (
              <div key={appt.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-all">
                <div className="flex-1">
                   <div className="flex gap-3 mb-3">
                       <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Confirmado</span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">{appt.serviceTitle}</h3>
                   <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                      <Briefcase size={16} className="text-slate-400" />
                      <span>{appt.professionalBusinessName}</span>
                   </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 min-w-[200px] flex flex-col justify-center">
                   <div className="flex items-center gap-3 mb-1">
                      <Calendar size={18} className="text-brand-600" />
                      <span className="font-bold text-slate-900">{new Date(appt.date).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-3 mb-4">
                      <Clock size={18} className="text-brand-600" />
                      <span className="font-bold text-slate-900">{appt.startTime} hs</span>
                   </div>
                   <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-white justify-center"
                    onClick={() => window.open(`https://wa.me/?text=Hola...`, '_blank')}
                   >
                     Contactar
                   </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-600">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 text-white p-2 rounded-xl shadow-lg shadow-brand-600/20">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">TurnoFácil</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user.name}</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{user.role === UserRole.PROFESSIONAL ? 'Profesional' : 'Cliente'}</span>
              </div>
              <div className="relative group">
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer" />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 p-2">
                   <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors">
                      <LogOut size={16} className="mr-2" /> Cerrar Sesión
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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