import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Stethoscope, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const VeterinarianCalendar = ({ appointments = [], isLoading = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get first day of month and number of days
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    appointments.forEach(apt => {
      const date = new Date(apt.fechaHoraInicio);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return appointmentsByDate[dateKey] || [];
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day names
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Month names
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Handle appointment click
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (estado) => {
    const s = (estado || '').toUpperCase();
    if (s === 'ESPERA') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s === 'CONFIRMADA') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'PROGRESO' || s === 'EN_PROGRESO' || s === 'EN_CURSO') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'FINALIZADA' || s === 'COMPLETADA') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'CANCELADA') return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'NO_ASISTIO' || s === 'NO ASISTIO') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Get status label
  const getStatusLabel = (estado) => {
    const s = (estado || '').toUpperCase();
    if (s === 'ESPERA') return 'En Espera';
    if (s === 'CONFIRMADA') return 'Confirmada';
    if (s === 'PROGRESO' || s === 'EN_PROGRESO' || s === 'EN_CURSO') return 'En Progreso';
    if (s === 'FINALIZADA' || s === 'COMPLETADA') return 'Finalizada';
    if (s === 'CANCELADA') return 'Cancelada';
    if (s === 'NO_ASISTIO' || s === 'NO ASISTIO') return 'No Asistió';
    return estado;
  };

  return (
    <div className="w-full bg-white rounded-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800 min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="gap-2"
        >
          <CalendarIcon className="w-4 h-4" />
          Hoy
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-medium text-slate-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] border border-slate-200 rounded-lg p-2 transition-colors",
                    !isCurrentMonthDay && "bg-slate-50 opacity-50",
                    isTodayDay && "bg-teal-50 border-teal-300 border-2",
                    dayAppointments.length > 0 && "bg-white"
                  )}
                >
                  {/* Day Number */}
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isTodayDay && "text-teal-600 font-bold",
                      !isCurrentMonthDay && "text-slate-400",
                      isCurrentMonthDay && !isTodayDay && "text-slate-700"
                    )}
                  >
                    {day.getDate()}
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt)}
                        className={cn(
                          "text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 hover:shadow-sm transition-all",
                          getStatusColor(apt.estado)
                        )}
                        title={`${new Date(apt.fechaHoraInicio).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - ${apt.nombreServicio || 'Consulta'} (${apt.estado})`}
                      >
                        <div className="font-medium truncate">
                          {new Date(apt.fechaHoraInicio).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="truncate text-[10px]">
                          {apt.nombreServicio || 'Consulta'}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-slate-500 font-medium px-1">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-slate-600">Estados:</span>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">En Espera</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">Confirmada</Badge>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">En Progreso</Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200">Finalizada</Badge>
          <Badge className="bg-red-100 text-red-700 border-red-200">Cancelada/No Asistió</Badge>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal-600" />
              Detalles de la Cita
            </DialogTitle>
            <DialogDescription>
              Información completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm px-3 py-1",
                    getStatusColor(selectedAppointment.estado)
                  )}
                >
                  {getStatusLabel(selectedAppointment.estado)}
                </Badge>
                <span className="text-sm text-slate-500">
                  ID: {selectedAppointment.id}
                </span>
              </div>

              {/* Service Information */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Servicio
                  </h3>
                  <p className="text-lg font-semibold text-slate-800">
                    {selectedAppointment.nombreServicio || 'Consulta'}
                  </p>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Fecha
                    </h3>
                    <p className="text-base text-slate-800">
                      {new Date(selectedAppointment.fechaHoraInicio).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora
                    </h3>
                    <p className="text-base text-slate-800">
                      {new Date(selectedAppointment.fechaHoraInicio).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {selectedAppointment.fechaHoraFin && (
                        <span className="text-slate-500">
                          {' - '}
                          {new Date(selectedAppointment.fechaHoraFin).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                {selectedAppointment.fechaHoraFin && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-600 mb-1">
                      Duración
                    </h3>
                    <p className="text-base text-slate-800">
                      {Math.round(
                        (new Date(selectedAppointment.fechaHoraFin) - new Date(selectedAppointment.fechaHoraInicio)) / 60000
                      )} minutos
                    </p>
                  </div>
                )}

                {/* Pet Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Mascota
                  </h3>
                  <p className="text-base text-slate-800">
                    ID: {selectedAppointment.petId}
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedAppointment.motivo || selectedAppointment.observaciones) && (
                <div className="space-y-3">
                  {selectedAppointment.motivo && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">
                        Motivo de Consulta
                      </h3>
                      <p className="text-base text-slate-800 bg-slate-50 rounded-lg p-3">
                        {selectedAppointment.motivo}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.observaciones && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-1">
                        Observaciones
                      </h3>
                      <p className="text-base text-slate-800 bg-slate-50 rounded-lg p-3">
                        {selectedAppointment.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VeterinarianCalendar;

