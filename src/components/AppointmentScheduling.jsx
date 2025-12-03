
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  User, 
  Stethoscope,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Dog,
  Cat,
  SearchX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const AppointmentScheduling = ({ veterinarianId, onUpdate }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [allPets, setAllPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [services, setServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    petId: '',
    servicioId: '',
    fechaInicio: '',
    motivoConsulta: '',
    estadoGeneralMascota: ''
  });

  useEffect(() => {
    fetchServices();
    fetchAllPets();
  }, []);

  const fetchAllPets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/mascotas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAllPets(data);
      } else {
        setAllPets([]);
        toast({
          title: "Mascotas no disponibles",
          description: "No se pudieron cargar las mascotas desde el servidor.",
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
      setAllPets([]);
    } finally {
      setIsLoading(false);
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
          title: "Servicios no disponibles",
          description: "No se pudieron cargar los servicios desde el servidor.",
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

  // Filter pets based on search term
  const filteredPets = allPets.filter(pet => 
    pet.nombre?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pet.propietario?.toLowerCase().includes(filterTerm.toLowerCase()) ||
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
    if (!selectedPet || !veterinarianId) {
      console.warn('🚫 [AGENDAR CITA] Validación fallida:', { selectedPet, veterinarianId });
      toast({
        title: "Error",
        description: "Por favor selecciona una mascota.",
        variant: "destructive"
      });
      return;
    }

    console.log('📅 [AGENDAR CITA] ===== INICIANDO CREACIÓN DE CITA =====');
    console.log('📅 [AGENDAR CITA] Datos de la cita:', {
      mascota: selectedPet.nombre,
      mascotaId: formData.petId,
      veterinarioId: veterinarianId,
      servicioId: formData.servicioId,
      fechaInicio: formData.fechaInicio,
      motivo: formData.motivoConsulta,
      estadoGeneral: formData.estadoGeneralMascota || 'NORMAL',
      usuarioId: localStorage.getItem('userId')
    });

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Convertir datetime-local a formato ISO sin conversión de timezone
      // El input datetime-local devuelve "YYYY-MM-DDTHH:mm" (sin timezone)
      // Necesitamos enviarlo como "YYYY-MM-DDTHH:mm:00" para LocalDateTime
      const fechaInicioISO = formData.fechaInicio ? `${formData.fechaInicio}:00` : null;
      
      const payload = {
        petId: formData.petId,
        veterinarianId: veterinarianId,
        servicioId: formData.servicioId,
        fechaInicio: fechaInicioISO,
        motivoConsulta: formData.motivoConsulta,
        estadoGeneralMascota: formData.estadoGeneralMascota || 'NORMAL'
      };

      const userId = localStorage.getItem('userId');
      
      console.log('📅 [AGENDAR CITA] Enviando petición POST a /api/citas');
      console.log('📅 [AGENDAR CITA] Payload:', payload);
      console.log('📅 [AGENDAR CITA] Headers:', {
        'Authorization': `Bearer ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`,
        'X-Usuario-Id': userId,
        'Content-Type': 'application/json'
      });

      const response = await fetch('https://api.veterinariacue.com/api/citas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📅 [AGENDAR CITA] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const citaCreada = await response.json();
        console.log('✅ [AGENDAR CITA] Cita creada exitosamente:', citaCreada);
        console.log('✅ [AGENDAR CITA] ID de cita:', citaCreada.id);
        console.log('✅ [AGENDAR CITA] Estado:', citaCreada.estado);
        console.log('✅ [AGENDAR CITA] Fecha/Hora:', citaCreada.fechaHoraInicio);
        console.log('📧 [AGENDAR CITA] Nota: El backend debería enviar correos al dueño y veterinario automáticamente');
        console.log('📅 [AGENDAR CITA] ===== CITA CREADA EXITOSAMENTE =====');
        
        toast({
          title: "Cita Agendada",
          description: `Cita agendada exitosamente para ${selectedPet.nombre}.`
        });
        
        // Reset form
        setFormData({
          petId: '',
          servicioId: '',
          fechaInicio: '',
          motivoConsulta: '',
          estadoGeneralMascota: ''
        });
        setSelectedPet(null);
        
        // Notify parent to refresh appointments list
        console.log('🔄 [AGENDAR CITA] Actualizando lista de citas...');
        if (onUpdate) {
          onUpdate();
          console.log('✅ [AGENDAR CITA] Lista de citas actualizada');
        }
      } else {
        let errorMessage = "Error al agendar la cita.";
        let errorDetails = "";
        
        try {
          const errorText = await response.text();
          errorDetails = errorText;
          
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
      console.error('❌ [AGENDAR CITA] ===== ERROR AL CREAR CITA =====');
      console.error('❌ [AGENDAR CITA] Error:', error);
      console.error('❌ [AGENDAR CITA] Mensaje:', error.message);
      console.error('❌ [AGENDAR CITA] Stack:', error.stack);
      toast({
        title: "Error",
        description: error.message || "No se pudo agendar la cita.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      console.log('🏁 [AGENDAR CITA] Proceso finalizado');
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
          <p className="text-slate-500 text-sm mt-1">Selecciona una mascota y programa una cita médica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pet List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-teal-600" />
              Lista de Mascotas
            </CardTitle>
            <CardDescription>Selecciona una mascota de la lista para agendar su cita.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Filtrar por nombre, propietario o raza..." 
                className="pl-10"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                disabled={!!selectedPet}
              />
            </div>

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
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" /> {selectedPet.propietario}
                      </p>
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
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {pet.propietario}
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-teal-600" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !selectedPet && filteredPets.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <SearchX className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{filterTerm ? 'No se encontraron mascotas con ese filtro.' : 'No hay mascotas registradas.'}</p>
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
              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="servicioId" className="text-slate-900">
                  Servicio <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="servicioId"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
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

export default AppointmentScheduling;

