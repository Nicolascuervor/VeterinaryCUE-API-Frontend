
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OwnerAppointments = ({ ownerId, onUpdate }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('todas'); // 'todas', 'pendientes', 'completadas', 'canceladas'

  useEffect(() => {
    fetchAppointments();
  }, [ownerId]);

  // Expose fetchAppointments to parent component
  useEffect(() => {
    if (onUpdate) {
      // Store the fetch function in a way that parent can call it
      window.refreshOwnerAppointments = fetchAppointments;
    }
    return () => {
      delete window.refreshOwnerAppointments;
    };
  }, [onUpdate]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    console.log('📋 [OWNER CITAS] Iniciando carga de citas para dueño ID:', ownerId);
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Fetch all appointments and filter by owner
      const response = await fetch('https://api.veterinariacue.com/api/citas/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [OWNER CITAS] Citas recibidas del backend:', data.length);
        
        // Filter appointments by owner
        const ownerAppointments = data.filter(apt => apt.duenioId === parseInt(ownerId));
        console.log('📊 [OWNER CITAS] Citas filtradas por dueño (ID: ' + ownerId + '):', ownerAppointments.length);
        
        // Sort by date (most recent first)
        ownerAppointments.sort((a, b) => {
          const dateA = new Date(a.fechaHoraInicio || a.fechayhora);
          const dateB = new Date(b.fechaHoraInicio || b.fechayhora);
          return dateB - dateA;
        });
        
        // Enrich appointments with pet and veterinarian names
        const enrichedAppointments = await Promise.all(
          ownerAppointments.map(async (apt) => {
            const enriched = { ...apt };
            
            // Fetch pet name
            if (apt.petId) {
              try {
                console.log(`🐾 [OWNER CITAS] Obteniendo datos de mascota ID: ${apt.petId}`);
                const petResponse = await fetch(`https://api.veterinariacue.com/api/mascotas/${apt.petId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (petResponse.ok) {
                  const pet = await petResponse.json();
                  enriched.mascota = pet.nombre;
                  enriched.mascotaNombre = pet.nombre;
                  console.log(`🐾 [OWNER CITAS] Mascota ID ${apt.petId} - Nombre: ${pet.nombre}`);
                } else {
                  console.warn(`❌ [OWNER CITAS] No se pudo obtener mascota ID: ${apt.petId}. Status: ${petResponse.status}`);
                }
              } catch (err) {
                console.warn("❌ [OWNER CITAS] Error al obtener nombre de mascota:", err);
              }
            }
            
            // Fetch veterinarian name
            if (apt.veterinarianId) {
              try {
                console.log(`👨‍⚕️ [OWNER CITAS] Obteniendo datos de veterinario ID: ${apt.veterinarianId}`);
                const vetResponse = await fetch(`https://api.veterinariacue.com/api/auth/${apt.veterinarianId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (vetResponse.ok) {
                  const vet = await vetResponse.json();
                  enriched.veterinarioNombre = `${vet.nombre || ''} ${vet.apellido || ''}`.trim();
                  console.log(`👨‍⚕️ [OWNER CITAS] Veterinario ID ${apt.veterinarianId} - Nombre: ${enriched.veterinarioNombre}`);
                } else {
                  console.warn(`❌ [OWNER CITAS] No se pudo obtener veterinario ID: ${apt.veterinarianId}. Status: ${vetResponse.status}`);
                }
              } catch (err) {
                console.warn("❌ [OWNER CITAS] Error al obtener nombre de veterinario:", err);
              }
            }
            
            return enriched;
          })
        );
        
        setAppointments(enrichedAppointments);
        console.log('📊 [OWNER CITAS] Citas enriquecidas y establecidas:', enrichedAppointments.length);
      } else {
        console.error('❌ [OWNER CITAS] Falló la carga de citas. Status:', response.status);
        toast({
          title: "Error",
          description: "No se pudieron cargar las citas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ [OWNER CITAS] Error al cargar citas:", error);
      toast({
        title: "Error",
        description: "Error al cargar las citas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 [OWNER CITAS] Carga de citas finalizada.');
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMADA' || s === 'PENDIENTE') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'EN_PROGRESO' || s === 'EN_CURSO') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'FINALIZADA' || s === 'COMPLETADA') return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'CANCELADA' || s === 'NO_ASISTIO') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMADA') return 'Confirmada';
    if (s === 'PENDIENTE') return 'Pendiente';
    if (s === 'EN_PROGRESO' || s === 'EN_CURSO') return 'En Progreso';
    if (s === 'FINALIZADA' || s === 'COMPLETADA') return 'Completada';
    if (s === 'CANCELADA') return 'Cancelada';
    if (s === 'NO_ASISTIO') return 'No Asistió';
    return status;
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'todas') return true;
    const status = (apt.estado || '').toUpperCase();
    if (filter === 'pendientes') {
      return status === 'PENDIENTE' || status === 'CONFIRMADA' || status === 'EN_PROGRESO' || status === 'EN_CURSO';
    }
    if (filter === 'completadas') {
      return status === 'FINALIZADA' || status === 'COMPLETADA';
    }
    if (filter === 'canceladas') {
      return status === 'CANCELADA' || status === 'NO_ASISTIO';
    }
    return true;
  });

  const upcomingAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.fechaHoraInicio || apt.fechayhora);
    return aptDate >= new Date() && (apt.estado === 'PENDIENTE' || apt.estado === 'CONFIRMADA');
  });

  const pastAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.fechaHoraInicio || apt.fechayhora);
    return aptDate < new Date() || apt.estado === 'FINALIZADA' || apt.estado === 'COMPLETADA';
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Mis Citas
          </h2>
          <p className="text-slate-500 text-sm mt-1">Historial y próximas citas programadas.</p>
        </div>
      </div>

      <Tabs defaultValue="futuras" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="futuras">Próximas Citas</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="futuras" className="space-y-4 mt-6">
          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay citas próximas</h3>
                <p className="text-slate-500">No tienes citas programadas en el futuro.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => {
                const aptDate = new Date(apt.fechaHoraInicio || apt.fechayhora);
                return (
                  <Card key={apt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{apt.mascotaNombre || 'Mascota'}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{aptDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(apt.estado)}>
                          {getStatusLabel(apt.estado)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {apt.motivo && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Stethoscope className="w-4 h-4 mt-0.5" />
                          <span>{apt.motivo}</span>
                        </div>
                      )}
                      {apt.veterinarioNombre && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-4 h-4" />
                          <span>Dr. {apt.veterinarioNombre}</span>
                        </div>
                      )}
                      {apt.servicioNombre && (
                        <div className="text-sm text-slate-500">
                          <span>Servicio: {apt.servicioNombre}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-6">
          {pastAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay historial de citas</h3>
                <p className="text-slate-500">Aún no has completado ninguna cita.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((apt) => {
                const aptDate = new Date(apt.fechaHoraInicio || apt.fechayhora);
                return (
                  <Card key={apt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{apt.mascotaNombre || 'Mascota'}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{aptDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(apt.estado)}>
                          {getStatusLabel(apt.estado)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {apt.motivo && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Stethoscope className="w-4 h-4 mt-0.5" />
                          <span>{apt.motivo}</span>
                        </div>
                      )}
                      {apt.veterinarioNombre && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="w-4 h-4" />
                          <span>Dr. {apt.veterinarioNombre}</span>
                        </div>
                      )}
                      {apt.observaciones && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                          <span className="font-semibold">Observaciones: </span>
                          {apt.observaciones}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerAppointments;

