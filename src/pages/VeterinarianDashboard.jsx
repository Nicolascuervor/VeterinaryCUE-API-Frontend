
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  Calendar as CalendarIcon, 
  ClipboardList, 
  History, 
  User, 
  LogOut, 
  Bell, 
  Stethoscope,
  CheckCircle2,
  MoreVertical,
  PawPrint,
  CalendarPlus
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Module Imports
import ConsultationManagement from '@/components/ConsultationManagement';
import ScheduleManagement from '@/components/ScheduleManagement';
import ClinicalHistory from '@/components/ClinicalHistory';
import ProfessionalProfile from '@/components/ProfessionalProfile';
import AppointmentScheduling from '@/components/AppointmentScheduling';

// Utility for JWT parsing
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const VeterinarianDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeModule, setActiveModule] = useState('agenda'); // 'agenda', 'consultas', 'horarios', 'historial', 'perfil', 'agendar'
  const [stats, setStats] = useState({ pending: 0, completed: 0 });

  // Verify Authentication & Role
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = parseJwt(token);
    
    // Enhanced Role Extraction Logic
    let role = '';
    if (decoded.roles && Array.isArray(decoded.roles)) {
        // If roles array exists, check for specific roles or take the first one
        if (decoded.roles.includes('ROLE_ADMIN')) role = 'ROLE_ADMIN';
        else if (decoded.roles.includes('ROLE_VETERINARIO')) role = 'ROLE_VETERINARIO';
        else role = decoded.roles[0];
    } else {
        // Fallback to older/other formats
        role = decoded?.role || decoded?.authorities?.[0] || '';
        if (typeof role === 'object' && role.authority) role = role.authority;
    }
    
    if (role && !role.toUpperCase().includes('VETERINARIO') && !role.toUpperCase().includes('ADMIN')) {
       console.warn("Warning: User might not be a veterinarian. Role:", role);
    }

    // Set user info
    const userId = localStorage.getItem('userId') || decoded?.usuarioId || decoded?.userId || decoded?.id;
    setUser({
      id: userId,
      name: decoded?.sub || 'Dr. Veterinario',
      role: 'Veterinario Senior',
      photo: localStorage.getItem('userPhoto')
    });

    fetchAppointments();
  }, [navigate]);

  // Fetch Today's Appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      try {
        const response = await fetch(`https://api.veterinariacue.com/api/citas/del-dia?fecha=${today}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
          // Calculate stats from real data
          const pending = data.filter(a => a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA').length;
          setStats(prev => ({ ...prev, pending }));
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        console.log("Using mock data because API is unreachable or not set up yet.");
        // Fallback Mock Data for demonstration
        const mockAppointments = [
            { 
                id: 1, 
                hora: '09:00', 
                mascota: 'Max', 
                propietario: 'Juan Pérez', 
                motivo: 'Vacunación Anual', 
                estado: 'COMPLETADA',
                tipo: 'Consulta General'
            },
            { 
                id: 2, 
                hora: '10:30', 
                mascota: 'Luna', 
                propietario: 'Maria Garcia', 
                motivo: 'Revisión Post-Cirugía', 
                estado: 'EN_CURSO',
                tipo: 'Seguimiento'
            },
            { 
                id: 3, 
                hora: '11:45', 
                mascota: 'Rocky', 
                propietario: 'Carlos Ruiz', 
                motivo: 'Problemas Digestivos', 
                estado: 'PENDIENTE',
                tipo: 'Urgencia'
            },
            { 
                id: 4, 
                hora: '14:00', 
                mascota: 'Bella', 
                propietario: 'Ana Lopez', 
                motivo: 'Corte de Uñas', 
                estado: 'PENDIENTE',
                tipo: 'Estética'
            },
            { 
                id: 5, 
                hora: '16:15', 
                mascota: 'Simba', 
                propietario: 'Pedro Diaz', 
                motivo: 'Consulta General', 
                estado: 'CONFIRMADA',
                tipo: 'Consulta General'
            }
        ];
        setAppointments(mockAppointments);
        setStats({ pending: 3, completed: 1 });
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error al cargar agenda",
        description: "No se pudieron cargar las citas del día.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhoto');
    navigate('/login');
  };

  // Components for different modules
  const renderModule = () => {
    switch (activeModule) {
      case 'agenda':
        return <AgendaView appointments={appointments} isLoading={isLoading} />;
      case 'consultas':
        return <ConsultationManagement appointments={appointments} onUpdate={fetchAppointments} />;
      case 'horarios':
        return <ScheduleManagement userId={user?.id} />;
      case 'historial':
        return <ClinicalHistory />;
      case 'perfil':
        return <ProfessionalProfile />;
      case 'agendar':
        return <AppointmentScheduling veterinarianId={user?.id} />;
      default:
        return <AgendaView appointments={appointments} isLoading={isLoading} />;
    }
  };

  // Helper: Next Appointment
  const nextAppointment = appointments.find(a => a.estado === 'PENDIENTE' || a.estado === 'EN_CURSO' || a.estado === 'CONFIRMADA' || a.estado === 'EN_PROGRESO');

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Helmet>
        <title>Dashboard Veterinario | VetCUE</title>
      </Helmet>

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <PawPrint size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">
              Vet<span className="text-teal-600">CUE</span> <span className="text-slate-400 font-normal text-sm ml-2">Portal Veterinario</span>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
             <NavButton active={activeModule === 'consultas'} onClick={() => setActiveModule('consultas')} icon={Stethoscope} label="Consultas" />
             <NavButton active={activeModule === 'agenda'} onClick={() => setActiveModule('agenda')} icon={ClipboardList} label="Agenda" />
             <NavButton active={activeModule === 'agendar'} onClick={() => setActiveModule('agendar')} icon={CalendarPlus} label="Agendar" />
             <NavButton active={activeModule === 'horarios'} onClick={() => setActiveModule('horarios')} icon={CalendarIcon} label="Horarios" />
             <NavButton active={activeModule === 'historial'} onClick={() => setActiveModule('historial')} icon={History} label="Historial" />
             <NavButton active={activeModule === 'perfil'} onClick={() => setActiveModule('perfil')} icon={User} label="Perfil" />
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 group outline-none">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-teal-700 transition-colors">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer group-hover:ring-2 group-hover:ring-teal-100 transition-all">
                    <AvatarImage src={user?.photo || ""} />
                    <AvatarFallback className="bg-teal-100 text-teal-700">Dr</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveModule('perfil')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveModule('horarios')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Mis Horarios</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left/Center Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner Mobile only */}
            <div className="md:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
               <h2 className="font-semibold text-slate-800">Hola, {user?.name}</h2>
               <p className="text-sm text-slate-500">Tienes {stats.pending} citas pendientes para hoy.</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Next Appointment Card */}
            <Card className="border-l-4 border-l-teal-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Próxima Cita</CardTitle>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{nextAppointment.mascota || nextAppointment.mascotaNombre}</h3>
                        <p className="text-sm text-slate-500">Dueño: {nextAppointment.propietario || nextAppointment.ownerName || 'Dueño'}</p>
                      </div>
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                        {nextAppointment.hora || (nextAppointment.fechaInicio ? new Date(nextAppointment.fechaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--')}
                      </Badge>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
                      <span className="font-semibold">Motivo:</span> {nextAppointment.motivo || nextAppointment.motivoConsulta}
                    </div>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => setActiveModule('consultas')}
                    >
                      Ir a Gestión de Consultas
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No hay más citas pendientes por hoy.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-blue-50 border-blue-100 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                  <p className="text-xs font-medium text-blue-400 uppercase mt-1">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-green-600">{appointments.filter(a => a.estado === 'COMPLETADA' || a.estado === 'FINALIZADA').length}</p>
                  <p className="text-xs font-medium text-green-400 uppercase mt-1">Atendidos</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button 
                   variant="ghost" 
                   className="justify-start h-auto py-3 px-4 border border-slate-100 hover:bg-slate-50"
                   onClick={() => setActiveModule('agendar')}
                >
                  <CalendarPlus className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="text-slate-700">Agendar Nueva Cita</span>
                </Button>
                <Button 
                   variant="ghost" 
                   className="justify-start h-auto py-3 px-4 border border-slate-100 hover:bg-slate-50"
                   onClick={() => setActiveModule('horarios')}
                >
                  <CalendarIcon className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="text-slate-700">Gestionar Horarios</span>
                </Button>
                <Button variant="ghost" className="justify-start h-auto py-3 px-4 border border-slate-100 hover:bg-slate-50">
                  <ClipboardList className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="text-slate-700">Nueva Receta Médica</span>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

// Sub-component for Agenda (ReadOnly View)
const AgendaView = ({ appointments, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
         {[1, 2, 3].map(i => (
           <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-xl"></div>
         ))}
      </div>
    );
  }

  return (
    <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-white pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-slate-800">Mi Agenda de Hoy</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
             <CalendarIcon className="w-4 h-4" /> Ver Calendario Completo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {appointments.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
                No hay citas programadas para hoy.
             </div>
          ) : (
            appointments.map((appointment, index) => (
              <div 
                key={appointment.id} 
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group"
              >
                {/* Time Column */}
                <div className="min-w-[80px] flex flex-col items-center justify-center sm:border-r sm:border-slate-100 pr-4">
                  <span className="text-lg font-bold text-slate-700">{appointment.hora || (appointment.fechaInicio ? new Date(appointment.fechaInicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--')}</span>
                  <span className="text-xs text-slate-400">HR</span>
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <h4 className="text-base font-bold text-slate-800 truncate">{appointment.mascota || appointment.mascotaNombre}</h4>
                     <Badge 
                        variant="secondary" 
                        className={
                           (appointment.estado === 'COMPLETADA' || appointment.estado === 'FINALIZADA') ? 'bg-green-100 text-green-700' : 
                           (appointment.estado === 'EN_CURSO' || appointment.estado === 'EN_PROGRESO') ? 'bg-blue-100 text-blue-700' :
                           'bg-yellow-100 text-yellow-700'
                        }
                     >
                       {appointment.estado}
                     </Badge>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-500">
                     <span className="flex items-center gap-1"><User className="w-3 h-3" /> {appointment.propietario || appointment.ownerName || 'Dueño'}</span>
                     <span className="hidden sm:inline text-slate-300">•</span>
                     <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {appointment.motivo || appointment.motivoConsulta}</span>
                   </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                      <MoreVertical className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 py-3 px-6 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
         <span>Mostrando {appointments.length} citas</span>
         <span>Actualizado hace un momento</span>
      </CardFooter>
    </Card>
  );
};

// Navigation Button Component
const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
      ${active 
        ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }
    `}
  >
    <Icon className={`w-4 h-4 mr-2 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
    {label}
  </button>
);

export default VeterinarianDashboard;
