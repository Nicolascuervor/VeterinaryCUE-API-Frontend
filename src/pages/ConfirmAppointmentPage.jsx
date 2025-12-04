import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';

const ConfirmAppointmentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchAppointmentDetails();
    } else {
      setError('Token de confirmación no válido');
      setIsLoading(false);
    }
  }, [token]);

  const fetchAppointmentDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Intentar obtener los detalles de la cita usando GET
      const response = await fetch(`https://api.veterinariacue.com/api/citas/public/confirmar/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        let data = await response.json();
        console.log('Datos recibidos del endpoint:', data);
        
        // Enriquecer datos usando los campos disponibles en la respuesta
        const enrichedData = { ...data };
        
        // Mapear campos alternativos para mascota
        enrichedData.mascotaNombre = data.mascotaNombre || data.mascota?.nombre || data.nombreMascota || 'N/A';
        enrichedData.mascota = enrichedData.mascotaNombre;
        
        // Mapear campos alternativos para veterinario
        if (data.veterinarioNombre) {
          enrichedData.veterinarioNombre = data.veterinarioNombre;
        } else if (data.veterinario) {
          if (typeof data.veterinario === 'string') {
            enrichedData.veterinarioNombre = data.veterinario;
          } else {
            enrichedData.veterinarioNombre = `${data.veterinario.nombre || ''} ${data.veterinario.apellido || ''}`.trim() || 'N/A';
          }
        } else {
          enrichedData.veterinarioNombre = 'N/A';
        }
        enrichedData.veterinario = enrichedData.veterinarioNombre;
        
        // Mapear motivo de consulta
        enrichedData.motivo = data.motivo || data.motivoConsulta || data.nombreServicio || 'Consulta';
        
        setAppointment(enrichedData);
        
        // Verificar si la cita ya está confirmada
        if (enrichedData.estado === 'CONFIRMADA') {
          setIsConfirmed(true);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Token de confirmación no válido o expirado' }));
        setError(errorData.message || 'No se pudo cargar la información de la cita');
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError('Error al conectar con el servidor. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);

      const response = await fetch(`https://api.veterinariacue.com/api/citas/public/confirmar/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        let data = await response.json();
        console.log('Datos recibidos después de confirmar:', data);
        
        // Enriquecer datos usando los campos disponibles en la respuesta
        const enrichedData = { ...data };
        
        // Mapear campos alternativos para mascota
        enrichedData.mascotaNombre = data.mascotaNombre || data.mascota?.nombre || data.nombreMascota || 'N/A';
        enrichedData.mascota = enrichedData.mascotaNombre;
        
        // Mapear campos alternativos para veterinario
        if (data.veterinarioNombre) {
          enrichedData.veterinarioNombre = data.veterinarioNombre;
        } else if (data.veterinario) {
          if (typeof data.veterinario === 'string') {
            enrichedData.veterinarioNombre = data.veterinario;
          } else {
            enrichedData.veterinarioNombre = `${data.veterinario.nombre || ''} ${data.veterinario.apellido || ''}`.trim() || 'N/A';
          }
        } else {
          enrichedData.veterinarioNombre = 'N/A';
        }
        enrichedData.veterinario = enrichedData.veterinarioNombre;
        
        // Mapear motivo de consulta
        enrichedData.motivo = data.motivo || data.motivoConsulta || data.nombreServicio || 'Consulta';
        
        setIsConfirmed(true);
        setAppointment(enrichedData);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error al confirmar la cita' }));
        setError(errorData.message || 'No se pudo confirmar la cita. Por favor, intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setError('Error al conectar con el servidor. Por favor, intenta nuevamente.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Helmet>
          <title>Confirmando Cita | VetCUE</title>
        </Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-slate-600">Cargando información de la cita...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Helmet>
          <title>Error | VetCUE</title>
        </Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Helmet>
        <title>{isConfirmed ? 'Cita Confirmada' : 'Confirmar Cita'} | VetCUE</title>
      </Helmet>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Vet<span className="text-teal-600">CUE</span>
          </h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            {isConfirmed ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">¡Cita Confirmada!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Tu cita ha sido confirmada exitosamente
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-teal-600" />
                </div>
                <CardTitle className="text-2xl text-slate-800">Confirmar Cita</CardTitle>
                <CardDescription className="text-base mt-2">
                  Por favor, confirma tu cita para asegurar tu horario
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {appointment && (
              <>
                {/* Appointment Details */}
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Detalles de la Cita</h3>
                    <Badge
                      variant="secondary"
                      className={
                        appointment.estado === 'CONFIRMADA'
                          ? 'bg-green-100 text-green-700'
                          : appointment.estado === 'ESPERA'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {appointment.estado === 'CONFIRMADA' ? 'Confirmada' : 
                       appointment.estado === 'ESPERA' ? 'En Espera' : 
                       appointment.estado}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Stethoscope className="w-5 h-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Mascota</p>
                        <p className="font-semibold text-slate-800">
                          {appointment.mascotaNombre || appointment.mascota || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Veterinario</p>
                        <p className="font-semibold text-slate-800">
                          {appointment.veterinarioNombre || appointment.veterinario || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Fecha</p>
                        <p className="font-semibold text-slate-800">
                          {appointment.fechaHoraInicio
                            ? new Date(appointment.fechaHoraInicio).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Hora</p>
                        <p className="font-semibold text-slate-800">
                          {appointment.fechaHoraInicio
                            ? new Date(appointment.fechaHoraInicio).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {appointment.motivo && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-600 mb-1">Motivo de Consulta</p>
                      <p className="text-slate-800">{appointment.motivo}</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isConfirmed && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleConfirm}
                      disabled={isConfirming}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      size="lg"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Cita
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Volver al inicio
                    </Button>
                  </div>
                )}

                {isConfirmed && (
                  <div className="text-center">
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                      size="lg"
                    >
                      Volver al inicio
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>Si tienes alguna pregunta, por favor contacta con la clínica veterinaria</p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAppointmentPage;

