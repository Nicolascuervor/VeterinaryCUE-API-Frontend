

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Thermometer, 
  Heart, 
  Activity, 
  Pill, 
  Calendar as CalendarIcon,
  Stethoscope,
  User,
  Weight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const ConsultationManagement = ({ appointments, onUpdate }) => {
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isNoShowDialogOpen, setIsNoShowDialogOpen] = useState(false);
  const [pendingNoShowAppointment, setPendingNoShowAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for Medical Data
  const [medicalData, setMedicalData] = useState({
    diagnostico: '',
    tratamiento: '',
    peso: '',
    temperatura: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    medicamentosRecetados: '',
    fechaProximaVisita: ''
  });

  const handleStartConsultation = async (appointment) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`https://api.veterinariacue.com/api/citas/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...appointment,
          estado: 'EN_PROGRESO'
        })
      });

      if (response.ok) {
        toast({
          title: "Consulta Iniciada",
          description: `Atendiendo a ${appointment.mascota || 'la mascota'}`
        });
        if (onUpdate) onUpdate();
      } else {
        throw new Error("No se pudo iniciar la consulta");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoShowClick = (appointment) => {
    setPendingNoShowAppointment(appointment);
    setIsNoShowDialogOpen(true);
  };

  const confirmNoShow = async () => {
    if (!pendingNoShowAppointment) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`https://api.veterinariacue.com/api/citas/${pendingNoShowAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...pendingNoShowAppointment,
          estado: 'CANCELADA',
          observaciones: 'No asistió a la consulta'
        })
      });

      if (response.ok) {
        toast({
          title: "Cita Cancelada",
          description: "Se ha registrado la inasistencia."
        });
        if (onUpdate) onUpdate();
      } else {
        throw new Error("Error al actualizar estado");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsNoShowDialogOpen(false);
      setPendingNoShowAppointment(null);
    }
  };

  const openFinishModal = (appointment) => {
    setSelectedAppointment(appointment);
    setMedicalData({
      diagnostico: '',
      tratamiento: '',
      peso: '',
      temperatura: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      medicamentosRecetados: '',
      fechaProximaVisita: ''
    });
    setIsFinishModalOpen(true);
  };

  const handleFinishSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      // Construct payload merging existing data with new medical data
      const payload = {
        ...selectedAppointment, // Keep existing fields
        estado: 'FINALIZADA',
        diagnostico: medicalData.diagnostico,
        tratamiento: medicalData.tratamiento,
        peso: parseFloat(medicalData.peso),
        temperatura: parseFloat(medicalData.temperatura),
        frecuenciaCardiaca: parseInt(medicalData.frecuenciaCardiaca),
        frecuenciaRespiratoria: parseInt(medicalData.frecuenciaRespiratoria),
        medicamentosRecetados: medicalData.medicamentosRecetados,
        observaciones: medicalData.fechaProximaVisita ? `Próxima visita sugerida: ${medicalData.fechaProximaVisita}` : ''
      };

      // Remove flat fields if they cause conflicts with backend objects, depending on API strictness
      // For now assuming backend handles it or ignores extra fields
      
      const response = await fetch(`https://api.veterinariacue.com/api/citas/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Consulta Finalizada",
          description: "Historia clínica actualizada exitosamente."
        });
        setIsFinishModalOpen(false);
        if (onUpdate) onUpdate();
      } else {
        throw new Error("Error al finalizar la consulta");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check status compatibility (English/Spanish/Legacy)
  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMADA' || s === 'PENDIENTE') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'EN_PROGRESO' || s === 'EN_CURSO') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'FINALIZADA' || s === 'COMPLETADA') return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'CANCELADA') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-teal-600" />
          Gestión de Consultas
        </h2>
        <Badge variant="outline" className="text-slate-500">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No hay citas programadas</h3>
            <p className="text-slate-500">No tienes consultas asignadas para el día de hoy.</p>
          </div>
        ) : (
          appointments.map((apt) => {
            const status = (apt.estado || '').toUpperCase();
            const isPending = status === 'CONFIRMADA' || status === 'PENDIENTE';
            const isInProgress = status === 'EN_PROGRESO' || status === 'EN_CURSO';
            const isFinished = status === 'FINALIZADA' || status === 'COMPLETADA';

            return (
              <Card key={apt.id} className={`border-l-4 shadow-sm transition-all hover:shadow-md
                ${isPending ? 'border-l-blue-500' : 
                  isInProgress ? 'border-l-amber-500' : 
                  isFinished ? 'border-l-green-500' : 'border-l-slate-300'}`
              }>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">{apt.mascota || apt.mascotaNombre}</CardTitle>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" /> {apt.propietario || apt.ownerName || 'Dueño'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="text-sm space-y-3 py-2">
                  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-md">
                    <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-700 font-medium">{apt.motivo || apt.motivoConsulta}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>{apt.hora || (apt.fechaInicio ? new Date(apt.fechaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--')}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex gap-2 justify-end border-t border-slate-100 mt-2">
                  {isPending && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleNoShowClick(apt)}
                        disabled={isLoading}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> No Asistencia
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleStartConsultation(apt)}
                        disabled={isLoading}
                      >
                        <Play className="w-4 h-4 mr-1" /> Iniciar
                      </Button>
                    </>
                  )}
                  
                  {isInProgress && (
                    <Button 
                      size="sm" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => openFinishModal(apt)}
                      disabled={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Finalizar Consulta
                    </Button>
                  )}

                  {isFinished && (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Completada
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* No Show Confirmation Dialog */}
      <Dialog open={isNoShowDialogOpen} onOpenChange={setIsNoShowDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Confirmar No Asistencia
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea marcar esta cita como no asistencia? Esta acción cancelará la cita.
            </DialogDescription>
          </DialogHeader>
          
          {pendingNoShowAppointment && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <p className="text-sm"><span className="font-semibold">Mascota:</span> {pendingNoShowAppointment.mascota}</p>
              <p className="text-sm"><span className="font-semibold">Dueño:</span> {pendingNoShowAppointment.propietario}</p>
              <p className="text-sm"><span className="font-semibold">Hora:</span> {pendingNoShowAppointment.hora}</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNoShowDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={confirmNoShow}
              disabled={isLoading}
            >
              Confirmar No Asistencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Consultation Modal */}
      <Dialog open={isFinishModalOpen} onOpenChange={setIsFinishModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Finalizar Consulta Médica
            </DialogTitle>
            <DialogDescription>
              Complete la información clínica para {selectedAppointment?.mascota}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFinishSubmit} className="space-y-4 py-2">
            
            {/* Signos Vitales */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> Signos Vitales
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Peso (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <Input 
                      type="number" 
                      step="0.1" 
                      className="pl-7 h-9" 
                      placeholder="0.0"
                      value={medicalData.peso}
                      onChange={(e) => setMedicalData({...medicalData, peso: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Temp (°C)</Label>
                  <div className="relative">
                    <Thermometer className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <Input 
                      type="number" 
                      step="0.1" 
                      className="pl-7 h-9" 
                      placeholder="38.5"
                      value={medicalData.temperatura}
                      onChange={(e) => setMedicalData({...medicalData, temperatura: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">FC (lpm)</Label>
                  <div className="relative">
                    <Heart className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <Input 
                      type="number" 
                      className="pl-7 h-9" 
                      placeholder="80"
                      value={medicalData.frecuenciaCardiaca}
                      onChange={(e) => setMedicalData({...medicalData, frecuenciaCardiaca: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">FR (rpm)</Label>
                  <div className="relative">
                    <Activity className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <Input 
                      type="number" 
                      className="pl-7 h-9" 
                      placeholder="20"
                      value={medicalData.frecuenciaRespiratoria}
                      onChange={(e) => setMedicalData({...medicalData, frecuenciaRespiratoria: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnóstico y Tratamiento */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" /> Diagnóstico
                </Label>
                <Textarea 
                  id="diagnostico" 
                  placeholder="Describa el diagnóstico clínico detallado..."
                  className="min-h-[80px]"
                  value={medicalData.diagnostico}
                  onChange={(e) => setMedicalData({...medicalData, diagnostico: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tratamiento" className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-500" /> Tratamiento
                </Label>
                <Textarea 
                  id="tratamiento" 
                  placeholder="Procedimientos realizados y plan de tratamiento..."
                  className="min-h-[80px]"
                  value={medicalData.tratamiento}
                  onChange={(e) => setMedicalData({...medicalData, tratamiento: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicamentos" className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-500" /> Medicamentos Recetados
                </Label>
                <Textarea 
                  id="medicamentos" 
                  placeholder="Nombre, dosis y frecuencia..."
                  className="min-h-[60px]"
                  value={medicalData.medicamentosRecetados}
                  onChange={(e) => setMedicalData({...medicalData, medicamentosRecetados: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proximaVisita" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-orange-500" /> Próxima Visita (Sugerida)
                </Label>
                <Input 
                  id="proximaVisita" 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={medicalData.fechaProximaVisita}
                  onChange={(e) => setMedicalData({...medicalData, fechaProximaVisita: e.target.value})}
                  className="w-full md:w-1/2"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFinishModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Guardar y Finalizar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationManagement;
