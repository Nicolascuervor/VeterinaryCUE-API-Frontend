
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Stethoscope,
  Thermometer,
  Heart,
  Weight,
  Pill,
  Dog,
  Cat,
  Loader2,
  SearchX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

const OwnerClinicalHistory = ({ ownerId }) => {
  const { toast } = useToast();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    fetchPets();
  }, [ownerId]);

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/mascotas/owner/${ownerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPets(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las mascotas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast({
        title: "Error",
        description: "Error al cargar las mascotas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (petId) => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const userId = localStorage.getItem('userId');
      
      const response = await fetch(`https://api.veterinariacue.com/api/historial-clinico/mascota/${petId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryRecords(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar el historial clínico.",
          variant: "destructive"
        });
        setHistoryRecords([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Error al cargar el historial clínico.",
        variant: "destructive"
      });
      setHistoryRecords([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    fetchHistory(pet.id);
  };

  const filteredPets = pets.filter(pet => 
    pet.nombre?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pet.raza?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              Historial Clínico
            </h2>
            <p className="text-slate-500 text-sm mt-1">Selecciona una mascota para ver su historial clínico.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Input 
                placeholder="Buscar mascota por nombre o raza..." 
                className="pl-10"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredPets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <SearchX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {pets.length === 0 ? 'No tienes mascotas registradas' : 'No se encontraron mascotas'}
              </h3>
              <p className="text-slate-500">
                {pets.length === 0 ? 'Registra una mascota para ver su historial clínico.' : 'Intenta con otro término de búsqueda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPets.map((pet) => (
              <Card 
                key={pet.id} 
                className="cursor-pointer hover:shadow-md hover:border-teal-300 transition-all"
                onClick={() => handleSelectPet(pet)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-100">
                    <AvatarFallback className="bg-slate-100">
                      {pet.especie === 'Felino' ? <Cat className="w-8 h-8 text-slate-400" /> : <Dog className="w-8 h-8 text-slate-400" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{pet.nombre}</h3>
                    <p className="text-sm text-slate-500">{pet.especie} • {pet.raza}</p>
                  </div>
                  <FileText className="w-5 h-5 text-teal-600" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPet(null)}>
            <span className="text-slate-600">← Volver</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              Historial Clínico - {selectedPet.nombre}
            </h2>
            <p className="text-slate-500 text-sm mt-1">{selectedPet.especie} • {selectedPet.raza}</p>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      {isLoadingHistory ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : historyRecords.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay historial registrado</h3>
            <p className="text-slate-500">Esta mascota aún no tiene registros clínicos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-3.5 before:h-full before:w-0.5 before:bg-slate-200">
          {historyRecords.map((record) => (
            <div key={record.id} className="relative">
              <div className="absolute -left-8 mt-1.5 h-7 w-7 rounded-full border-4 border-white bg-teal-500 flex items-center justify-center shadow-sm">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {new Date(record.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-slate-300 mx-2">|</span>
                      <span className="text-sm text-slate-500">{record.veterinario || 'Dr. Veterinario'}</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">Consulta</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 grid gap-4">
                  {/* Vital Signs */}
                  {(record.peso || record.temperatura) && (
                    <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      {record.peso && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Weight className="w-4 h-4 text-slate-400" /> 
                          <span className="font-semibold">{record.peso} kg</span>
                        </div>
                      )}
                      {record.temperatura && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Thermometer className="w-4 h-4 text-red-400" /> 
                          <span className="font-semibold">{record.temperatura}°C</span>
                        </div>
                      )}
                      {record.frecuenciaCardiaca && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Heart className="w-4 h-4 text-pink-400" /> 
                          <span className="font-semibold">FC: {record.frecuenciaCardiaca} lpm</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                        <Stethoscope className="w-4 h-4 text-teal-500" /> Diagnóstico
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-md">
                        {record.diagnostico || 'No especificado'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                        <Pill className="w-4 h-4 text-amber-500" /> Tratamiento
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-md">
                        {record.tratamiento || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {record.medicamentosRecetados && (
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-2">
                        <Pill className="w-4 h-4 text-purple-500" /> Medicamentos Recetados
                      </h4>
                      <p className="text-sm text-slate-600 italic">
                        {record.medicamentosRecetados}
                      </p>
                    </div>
                  )}

                  {record.examenesRealizados && (
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">Exámenes Realizados</h4>
                      <p className="text-sm text-slate-600">
                        {record.examenesRealizados}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerClinicalHistory;

