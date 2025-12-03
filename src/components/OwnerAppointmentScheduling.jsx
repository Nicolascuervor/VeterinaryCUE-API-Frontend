
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  Stethoscope,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Dog,
  Cat,
  SearchX,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const OwnerAppointmentScheduling = ({ ownerId, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [ownerPets, setOwnerPets] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [services, setServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    petId: '',
    veterinarianId: '',
    servicioId: '',
    fechaInicio: '',
    motivoConsulta: '',
    estadoGeneralMascota: ''
  });

  useEffect(() => {
    fetchServices();
    fetchOwnerPets();
    fetchVeterinarians();
  }, [ownerId]);

  const fetchOwnerPets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/mascotas/owner/${ownerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOwnerPets(data);
      } else {
        setOwnerPets([]);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus mascotas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las mascotas.",
        variant: "destructive"
      });
      setOwnerPets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVeterinarians = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.warn("No token available for fetching veterinarians");
        return;
      }

      // Fetch veterinarians from auth service
      const response = await fetch('https://api.veterinariacue.com/api/auth/active/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const users = await response.json();
        console.log("📋 [OWNER AGENDAR] Usuarios obtenidos:", users.length);
        
        // Filter veterinarians - check multiple possible field names
        // Based on backend entity, the field is 'userRole' (enum Role)
        const vets = users.filter(user => {
          // Check userRole first (primary field from backend)
          const role = user.userRole || user.role || user.rol || user.tipoUsuario || '';
          const roleUpper = String(role).toUpperCase();
          
          // Check if it's a veterinarian role
          const isVet = roleUpper === 'ROLE_VETERINARIO' || 
                       roleUpper === 'VETERINARIO' ||
                       roleUpper.includes('VETERINARIO') || 
                       roleUpper.includes('VET');
          
          // Also check if user is active
          const isActive = user.activo !== false;
          
          return isVet && isActive;
        });
        
        console.log("👨‍⚕️ [OWNER AGENDAR] Veterinarios filtrados:", vets.length);
        console.log("👨‍⚕️ [OWNER AGENDAR] Veterinarios:", vets);
        
        if (vets.length === 0) {
          console.warn("⚠️ [OWNER AGENDAR] No se encontraron veterinarios. Estructura de usuarios:", users[0]);
        }
        
        setVeterinarians(vets);
      } else {
        const errorText = await response.text();
        console.error("❌ [OWNER AGENDAR] Error al obtener veterinarios:", response.status, errorText);
        toast({
          title: "Error",
          description: "No se pudieron cargar los veterinarios disponibles.",
          variant: "destructive"
        });
        setVeterinarians([]);
      }
    } catch (error) {
      console.error("❌ [OWNER AGENDAR] Error fetching veterinarians:", error);
      toast({
        title: "Error",
        description: "Error al cargar los veterinarios. Por favor intenta nuevamente.",
        variant: "destructive"
      });
      setVeterinarians([]);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/agendamiento/servicios-admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        setServices([]);
        toast({
          title: "Error",
          description: "No se pudieron cargar los servicios.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios.",
        variant: "destructive"
      });
    }
  };

  const filteredPets = ownerPets.filter(pet => 
    pet.nombre?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pet.raza?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    setFormData(prev => ({ ...prev, petId: pet.id }));
  };

  const handleClearSelection = () => {
    setSelectedPet(null);
    setFormData(prev => ({ ...prev, petId: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPet || !formData.veterinarianId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const userId = localStorage.getItem('userId');
      
      // Convertir datetime-local a formato ISO sin conversión de timezone
      // El input datetime-local devuelve "YYYY-MM-DDTHH:mm" (sin timezone)
      // Necesitamos enviarlo como "YYYY-MM-DDTHH:mm:00" para LocalDateTime
      const fechaInicioISO = formData.fechaInicio ? `${formData.fechaInicio}:00` : null;
      
      const payload = {
        petId: formData.petId,
        veterinarianId: formData.veterinarianId,
        servicioId: formData.servicioId,
        fechaInicio: fechaInicioISO,
        motivoConsulta: formData.motivoConsulta,
        estadoGeneralMascota: formData.estadoGeneralMascota || 'NORMAL'
      };

      const response = await fetch('https://api.veterinariacue.com/api/citas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ [OWNER AGENDAR] Cita agendada exitosamente');
        toast({
          title: "Cita Agendada",
          description: `Cita agendada exitosamente para ${selectedPet.nombre}.`
        });
        
        // Reset form
        setFormData({
          petId: '',
          veterinarianId: '',
          servicioId: '',
          fechaInicio: '',
          motivoConsulta: '',
          estadoGeneralMascota: ''
        });
        setSelectedPet(null);
        
        // Trigger updates
        if (onUpdate) {
          onUpdate();
          console.log('🔄 [OWNER AGENDAR] Actualizando estadísticas del dashboard');
        }
        
        // Refresh appointments list if available
        if (window.refreshOwnerAppointments) {
          setTimeout(() => {
            window.refreshOwnerAppointments();
            console.log('🔄 [OWNER AGENDAR] Actualizando lista de citas');
          }, 500);
        }
      } else {
        let errorMessage = "Error al agendar la cita.";
        
        try {
          const errorText = await response.text();
          
          // Intentar parsear como JSON si es posible
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            // Si no es JSON, usar el texto directamente
            if (errorText.includes("no trabaja") || errorText.includes("jornada laboral")) {
              errorMessage = "El veterinario no tiene horario configurado para este día/hora.";
            } else if (errorText.includes("conflicto") || errorText.includes("ocupación")) {
              errorMessage = "El horario seleccionado ya está ocupado. Por favor seleccione otra hora.";
            } else if (errorText.includes("descanso")) {
              errorMessage = "El horario seleccionado coincide con el tiempo de descanso del veterinario.";
            } else if (errorText.includes("fuera")) {
              errorMessage = "El horario está fuera del horario laboral del veterinario.";
            } else {
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (e) {
          // Si no se puede leer el error, usar mensajes por código de estado
          if (response.status === 400) {
            errorMessage = "El horario seleccionado no es válido. Verifique que el veterinario trabaje en ese día y hora.";
          } else if (response.status === 409) {
            errorMessage = "Conflicto de horario. Por favor seleccione otra hora.";
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agendar la cita.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Agendar Nueva Cita
          </h2>
          <p className="text-slate-500 text-sm mt-1">Selecciona una de tus mascotas y programa una cita médica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pet List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-teal-600" />
              Mis Mascotas
            </CardTitle>
            <CardDescription>Selecciona una mascota para agendar su cita.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Input */}
            {!selectedPet && (
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Buscar por nombre o raza..." 
                  className="pl-10"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                />
              </div>
            )}

            {/* Selected Pet Display */}
            {selectedPet && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-teal-200">
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {selectedPet.especie === 'Felino' ? <Cat className="w-6 h-6" /> : <Dog className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedPet.nombre}</h3>
                      <p className="text-sm text-slate-600">{selectedPet.especie} • {selectedPet.raza}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Cambiar
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-teal-700 bg-white px-2 py-1 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  Mascota seleccionada
                </div>
              </div>
            )}

            {/* Pets List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : !selectedPet && filteredPets.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPets.map((pet) => (
                  <Card 
                    key={pet.id} 
                    className="cursor-pointer hover:shadow-md hover:border-teal-300 transition-all"
                    onClick={() => handleSelectPet(pet)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-slate-100">
                        <AvatarFallback className="bg-slate-100">
                          {pet.especie === 'Felino' ? <Cat className="w-6 h-6 text-slate-400" /> : <Dog className="w-6 h-6 text-slate-400" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{pet.nombre}</h3>
                        <p className="text-sm text-slate-500">{pet.especie} • {pet.raza}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !selectedPet && filteredPets.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <SearchX className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{filterTerm ? 'No se encontraron mascotas con ese filtro.' : 'No tienes mascotas registradas. Regístra una primero.'}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Right Column: Appointment Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Detalles de la Cita
            </CardTitle>
            <CardDescription>Completa la información para agendar la cita.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Veterinarian Selection */}
              <div className="space-y-2">
                <Label htmlFor="veterinarianId" className="text-slate-900">
                  Veterinario <span className="text-red-500">*</span>
                </Label>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando veterinarios...
                  </div>
                ) : (
                  <select 
                    id="veterinarianId"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                    value={formData.veterinarianId}
                    onChange={(e) => setFormData({...formData, veterinarianId: e.target.value})}
                    required
                    disabled={!selectedPet || veterinarians.length === 0}
                  >
                    <option value="">
                      {veterinarians.length === 0 ? 'No hay veterinarios disponibles' : 'Seleccionar Veterinario'}
                    </option>
                    {veterinarians.map(vet => (
                      <option key={vet.id} value={vet.id}>
                        {vet.nombre && vet.apellido 
                          ? `Dr. ${vet.nombre} ${vet.apellido}`
                          : vet.nombre || vet.correo || `Veterinario ID: ${vet.id}`
                        }
                      </option>
                    ))}
                  </select>
                )}
                {veterinarians.length === 0 && !isLoading && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No hay veterinarios disponibles en este momento.
                  </p>
                )}
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="servicioId" className="text-slate-900">
                  Servicio <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="servicioId"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  value={formData.servicioId}
                  onChange={(e) => setFormData({...formData, servicioId: e.target.value})}
                  required
                  disabled={!selectedPet}
                >
                  <option value="">Seleccionar Servicio</option>
                  {services.map(srv => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nombre} - ${srv.precio}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fecha y Hora <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="fechaInicio" 
                  type="datetime-local" 
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  required
                  disabled={!selectedPet}
                  className="text-slate-900"
                />
                <p className="text-xs text-slate-500">Selecciona la fecha y hora para la cita.</p>
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivoConsulta" className="text-slate-900">
                  Motivo de Consulta <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="motivoConsulta" 
                  value={formData.motivoConsulta} 
                  onChange={(e) => setFormData({...formData, motivoConsulta: e.target.value})} 
                  required
                  placeholder="Ej. Vacunación anual, Revisión general..."
                  disabled={!selectedPet}
                  className="text-slate-900"
                />
              </div>

              {/* Estado General */}
              <div className="space-y-2">
                <Label htmlFor="estadoGeneralMascota" className="text-slate-900">
                  Estado General de la Mascota
                </Label>
                <Textarea 
                  id="estadoGeneralMascota" 
                  value={formData.estadoGeneralMascota} 
                  onChange={(e) => setFormData({...formData, estadoGeneralMascota: e.target.value})} 
                  placeholder="Observaciones sobre el estado actual de la mascota (opcional)"
                  disabled={!selectedPet}
                  className="min-h-[80px] text-slate-900"
                />
              </div>

              {/* Info Alert */}
              {!selectedPet && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Por favor selecciona una mascota de la lista para continuar.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
                disabled={!selectedPet || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerAppointmentScheduling;

