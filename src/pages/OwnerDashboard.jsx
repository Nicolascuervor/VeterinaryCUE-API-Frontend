
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  Calendar as CalendarIcon, 
  History, 
  User, 
  LogOut, 
  Bell, 
  PawPrint,
  CalendarPlus,
  ShoppingCart,
  Package,
  Heart,
  FileText
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
import OwnerPets from '@/components/OwnerPets';
import OwnerClinicalHistory from '@/components/OwnerClinicalHistory';
import OwnerAppointments from '@/components/OwnerAppointments';
import OwnerAppointmentScheduling from '@/components/OwnerAppointmentScheduling';
import OwnerEcommerce from '@/components/OwnerEcommerce';
import OwnerProfile from '@/components/OwnerProfile';

// Utility for JWT parsing
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('inicio'); // 'inicio', 'mascotas', 'historial', 'citas', 'agendar', 'tienda', 'perfil'
  const [stats, setStats] = useState({ 
    mascotas: 0, 
    citasPendientes: 0, 
    citasCompletadas: 0 
  });

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
        if (decoded.roles.includes('ROLE_ADMIN')) role = 'ROLE_ADMIN';
        else if (decoded.roles.includes('ROLE_VETERINARIO')) role = 'ROLE_VETERINARIO';
        else if (decoded.roles.includes('ROLE_DUENIO')) role = 'ROLE_DUENIO';
        else role = decoded.roles[0];
    } else {
        role = decoded?.role || decoded?.authorities?.[0] || '';
        if (typeof role === 'object' && role.authority) role = role.authority;
    }
    
    if (role && !role.toUpperCase().includes('DUENIO')) {
       console.warn("Warning: User might not be a dueño. Role:", role);
       // Redirect if not dueño
       if (role.toUpperCase().includes('VETERINARIO')) {
         navigate('/dashboard/veterinarian');
         return;
       } else if (role.toUpperCase().includes('ADMIN')) {
         navigate('/dashboard/admin');
         return;
       }
    }

    // Set user info
    const userId = localStorage.getItem('userId') || decoded?.usuarioId || decoded?.userId || decoded?.id;
    fetchUserProfile(userId);
    fetchStats(userId);
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/auth/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.id,
          name: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Dueño',
          email: data.correo || '',
          phone: data.telefono || '',
          address: data.direccion || '',
          photo: data.foto || localStorage.getItem('userPhoto')
        });
      } else {
        // Fallback to token data
        const decoded = parseJwt(localStorage.getItem('jwtToken'));
        setUser({
          id: userId,
          name: decoded?.sub || 'Dueño',
          email: decoded?.sub || '',
          photo: localStorage.getItem('userPhoto')
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const decoded = parseJwt(localStorage.getItem('jwtToken'));
      setUser({
        id: userId,
        name: decoded?.sub || 'Dueño',
        email: decoded?.sub || '',
        photo: localStorage.getItem('userPhoto')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Fetch pets count
      const petsResponse = await fetch(`https://api.veterinariacue.com/api/mascotas/owner/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (petsResponse.ok) {
        const pets = await petsResponse.json();
        setStats(prev => ({ ...prev, mascotas: pets.length || 0 }));
      }

      // Fetch appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await fetch(`https://api.veterinariacue.com/api/citas/del-dia?fecha=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (appointmentsResponse.ok) {
        const appointments = await appointmentsResponse.json();
        // Filter by owner
        const ownerAppointments = appointments.filter(apt => apt.duenioId === parseInt(userId));
        const pending = ownerAppointments.filter(a => 
          a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA' || a.estado === 'EN_PROGRESO'
        ).length;
        const completed = ownerAppointments.filter(a => 
          a.estado === 'FINALIZADA' || a.estado === 'COMPLETADA'
        ).length;
        
        setStats(prev => ({ 
          ...prev, 
          citasPendientes: pending,
          citasCompletadas: completed
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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
      case 'mascotas':
        return <OwnerPets ownerId={user?.id} onUpdate={() => fetchStats(user?.id)} />;
      case 'historial':
        return <OwnerClinicalHistory ownerId={user?.id} />;
      case 'citas':
        return <OwnerAppointments ownerId={user?.id} />;
      case 'agendar':
        return <OwnerAppointmentScheduling ownerId={user?.id} onUpdate={() => fetchStats(user?.id)} />;
      case 'tienda':
        return <OwnerEcommerce ownerId={user?.id} />;
      case 'perfil':
        return <OwnerProfile userId={user?.id} onUpdate={() => fetchUserProfile(user?.id)} />;
      default:
        return <HomeView stats={stats} user={user} onNavigate={setActiveModule} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Helmet>
        <title>Mi Panel | VetCUE</title>
      </Helmet>

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <PawPrint size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">
              Vet<span className="text-teal-600">CUE</span> <span className="text-slate-400 font-normal text-sm ml-2">Mi Panel</span>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
             <NavButton active={activeModule === 'mascotas'} onClick={() => setActiveModule('mascotas')} icon={PawPrint} label="Mis Mascotas" />
             <NavButton active={activeModule === 'citas'} onClick={() => setActiveModule('citas')} icon={CalendarIcon} label="Mis Citas" />
             <NavButton active={activeModule === 'agendar'} onClick={() => setActiveModule('agendar')} icon={CalendarPlus} label="Agendar" />
             <NavButton active={activeModule === 'historial'} onClick={() => setActiveModule('historial')} icon={FileText} label="Historial" />
             <NavButton active={activeModule === 'tienda'} onClick={() => setActiveModule('tienda')} icon={ShoppingCart} label="Tienda" />
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
                    <p className="text-xs text-slate-400">Dueño</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer group-hover:ring-2 group-hover:ring-teal-100 transition-all">
                    <AvatarImage src={user?.photo || ""} />
                    <AvatarFallback className="bg-teal-100 text-teal-700">D</AvatarFallback>
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
      </main>
    </div>
  );
};

// Home View Component
const HomeView = ({ stats, user, onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-none shadow-md bg-gradient-to-r from-teal-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Hola, {user?.name || 'Dueño'}!</h2>
              <p className="text-slate-600">Bienvenido a tu panel de control. Gestiona tus mascotas, citas y más.</p>
            </div>
            <div className="hidden md:block">
              <PawPrint className="w-16 h-16 text-teal-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('mascotas')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PawPrint className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.mascotas}</p>
            <p className="text-sm text-slate-500 mt-1">Mascotas Registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('citas')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.citasPendientes}</p>
            <p className="text-sm text-slate-500 mt-1">Citas Pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('citas')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.citasCompletadas}</p>
            <p className="text-sm text-slate-500 mt-1">Citas Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('agendar')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <CalendarPlus className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Agendar Nueva Cita</h3>
              <p className="text-sm text-slate-500">Programa una consulta</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('mascotas')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Mis Mascotas</h3>
              <p className="text-sm text-slate-500">Ver y gestionar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('tienda')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Tienda</h3>
              <p className="text-sm text-slate-500">Productos y accesorios</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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

export default OwnerDashboard;

