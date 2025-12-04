import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Mapeo de DayOfWeek de Java a índices de JavaScript (0=Dom, 1=Lun, etc.)
const DAY_OF_WEEK_MAP = {
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6,
  'SUNDAY': 0
};

const AvailabilityCalendar = ({ veterinarianId, onTimeSelect, selectedDateTime, serviceDuration = 30 }) => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarData, setCalendarData] = useState(null);

  // Calcular rango de fechas para el mes actual
  const getMonthRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  // Obtener datos del calendario del backend
  useEffect(() => {
    if (!veterinarianId) return;

    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('jwtToken');
        const { start, end } = getMonthRange(currentMonth);
        
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const response = await fetch(
          `https://api.veterinariacue.com/api/agendamiento/calendario/${veterinarianId}?fechaInicio=${startStr}&fechaFin=${endStr}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCalendarData(data);
        } else {
          console.error('Error fetching calendar data:', response.status);
          toast({
            title: "Error",
            description: "No se pudieron cargar los horarios disponibles.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching calendar:', error);
        toast({
          title: "Error",
          description: "Error al cargar los horarios.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [veterinarianId, currentMonth]);

  // Calcular slots disponibles para una fecha específica
  const calculateAvailableSlots = (date) => {
    if (!calendarData) return [];

    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, etc.
    const slots = [];

    // Encontrar jornada para este día de la semana
    const jornada = calendarData.jornadasConfiguradas?.find(j => {
      const javaDayIndex = DAY_OF_WEEK_MAP[j.diaSemana] ?? -1;
      return javaDayIndex === dayOfWeek && j.activa;
    });

    if (!jornada) return [];

    // Parsear horas de inicio y fin
    const startTime = parseTime(jornada.horaInicioJornada);
    const endTime = parseTime(jornada.horaFinJornada);
    const breakStart = jornada.horaInicioDescanso ? parseTime(jornada.horaInicioDescanso) : null;
    const breakEnd = jornada.horaFinDescanso ? parseTime(jornada.horaFinDescanso) : null;

    // Generar slots cada 30 minutos (o según serviceDuration)
    const slotInterval = serviceDuration || 30;
    let currentTime = new Date(date);
    currentTime.setHours(startTime.hours, startTime.minutes, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime.getTime() + slotInterval * 60000);
      
      // Verificar si el slot está en el descanso
      let isInBreak = false;
      if (breakStart && breakEnd) {
        const breakStartTime = new Date(date);
        breakStartTime.setHours(breakStart.hours, breakStart.minutes, 0, 0);
        const breakEndTime = new Date(date);
        breakEndTime.setHours(breakEnd.hours, breakEnd.minutes, 0, 0);
        isInBreak = (currentTime >= breakStartTime && slotEnd <= breakEndTime);
      }

      if (!isInBreak) {
        // Verificar si el slot está ocupado
        const isOccupied = calendarData.ocupaciones?.some(ocup => {
          const ocupStart = new Date(ocup.fechaInicio);
          const ocupEnd = new Date(ocup.fechaFin);
          return (currentTime < ocupEnd && slotEnd > ocupStart);
        });

        if (!isOccupied) {
          // Verificar que no sea en el pasado
          const now = new Date();
          if (currentTime > now) {
            slots.push(new Date(currentTime));
          }
        }
      }

      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }

    return slots;
  };

  // Parsear tiempo desde string "HH:mm:ss" o "HH:mm"
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0
    };
  };

  // Cuando se selecciona una fecha, calcular los slots disponibles
  useEffect(() => {
    if (selectedDate) {
      const slots = calculateAvailableSlots(selectedDate);
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, calendarData, serviceDuration]);

  // Generar días del mes
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior (para completar la primera semana)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }

    // Días del mes siguiente (para completar la última semana)
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Verificar si un día tiene disponibilidad
  const hasAvailability = (date) => {
    if (!calendarData) return false;
    const dayOfWeek = date.getDay();
    const jornada = calendarData.jornadasConfiguradas?.find(j => {
      const javaDayIndex = DAY_OF_WEEK_MAP[j.diaSemana] ?? -1;
      return javaDayIndex === dayOfWeek && j.activa;
    });
    return !!jornada;
  };

  // Verificar si un día está en el pasado
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleDateClick = (date) => {
    if (isPastDate(date) || !hasAvailability(date)) return;
    setSelectedDate(new Date(date));
  };

  const handleTimeSlotClick = (slot) => {
    if (onTimeSelect) {
      onTimeSelect(slot);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            Seleccionar Fecha y Hora
          </CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navegación del mes */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold text-slate-800">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Días de la semana */}
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 p-2">
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            const hasAvail = hasAvailability(date);
            const isPast = isPastDate(date);
            const isSelected = selectedDate && 
              date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={isPast || !hasAvail}
                className={`
                  aspect-square p-2 text-sm rounded-md transition-all
                  ${!isCurrentMonth ? 'text-slate-300' : ''}
                  ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                  ${!hasAvail && isCurrentMonth ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                  ${hasAvail && !isPast && isCurrentMonth ? 'hover:bg-teal-50 cursor-pointer' : ''}
                  ${isSelected ? 'bg-teal-600 text-white font-semibold' : ''}
                  ${isToday && !isSelected ? 'ring-2 ring-teal-500' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Slots disponibles para la fecha seleccionada */}
        {selectedDate && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horarios Disponibles - {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
                <p>No hay horarios disponibles para este día.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map((slot, index) => {
                  const isSelected = selectedDateTime && 
                    slot.getTime() === new Date(selectedDateTime).getTime();
                  
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSlotClick(slot)}
                      className={`
                        ${isSelected 
                          ? 'bg-teal-600 text-white hover:bg-teal-700' 
                          : 'hover:bg-teal-50 hover:border-teal-300'
                        }
                      `}
                    >
                      {formatTime(slot)}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-4 text-slate-500 text-sm">
            Selecciona una fecha para ver los horarios disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;

