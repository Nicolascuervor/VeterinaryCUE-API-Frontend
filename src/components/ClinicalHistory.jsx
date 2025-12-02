
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  History as HistoryIcon, 
  FileText, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  User, 
  Activity, 
  Save,
  Stethoscope,
  Thermometer,
  Heart,
  Wind,
  Weight,
  Pill,
  Microscope,
  Dog,
  Cat,
  SearchX,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ClinicalHistory = () => {
  const { toast } = useToast();
  const [view, setView] = useState('list'); // 'list', 'history', 'create'
  const [filterTerm, setFilterTerm] = useState('');
  const [allPets, setAllPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyRecords, setHistoryRecords] = useState([]);
  
  // Form State
  const [newRecord, setNewRecord] = useState({
    diagnostico: '',
    tratamiento: '',
    peso: '',
    temperatura: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    examenesRealizados: '',
    medicamentosRecetados: ''
  });

  useEffect(() => {
    fetchAllPets();
  }, []);

  // Fetch all pets on component mount
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

  // Filter pets based on search term
  const filteredPets = allPets.filter(pet => 
    pet.nombre?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pet.propietario?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pet.raza?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // 2. Select Pet & Fetch History
  const handleSelectPet = async (pet) => {
    setSelectedPet(pet);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      // Assuming endpoint for history by pet ID
      const response = await fetch(`https://api.veterinariacue.com/api/historial-clinico/mascota/${pet.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryRecords(data);
      } else {
        setHistoryRecords([]);
        toast({
          title: "Historial no disponible",
          description: "No se pudo cargar el historial clínico desde el servidor.",
          variant: "destructive"
        });
      }
      setView('history');
    } catch (error) {
      console.error("History fetch error:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial clínico.",
        variant: "destructive"
      });
      setHistoryRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Submit New Record
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      const userId = localStorage.getItem('userId'); // Assuming userId is stored
      
      const payload = {
        mascotaId: selectedPet.id,
        veterinarioId: userId, // Or derive from token on backend
        fecha: new Date().toISOString(),
        diagnostico: newRecord.diagnostico,
        tratamiento: newRecord.tratamiento,
        peso: parseFloat(newRecord.peso),
        temperatura: parseFloat(newRecord.temperatura),
        frecuenciaCardiaca: parseInt(newRecord.frecuenciaCardiaca),
        frecuenciaRespiratoria: parseInt(newRecord.frecuenciaRespiratoria),
        examenesRealizados: newRecord.examenesRealizados,
        medicamentosRecetados: newRecord.medicamentosRecetados
      };

      const response = await fetch('https://api.veterinariacue.com/api/historial-clinico', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Registro Creado",
          description: "El historial clínico ha sido actualizado."
        });
        // Refresh history
        handleSelectPet(selectedPet);
        // Reset form
        setNewRecord({
          diagnostico: '', tratamiento: '', peso: '', temperatura: '', 
          frecuenciaCardiaca: '', frecuenciaRespiratoria: '', 
          examenesRealizados: '', medicamentosRecetados: ''
        });
        setView('history');
      } else {
        throw new Error("No se pudo guardar el registro");
      }
    } catch (error) {
      console.error("Error saving record:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro clínico.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Views
  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="p-3 bg-teal-100 rounded-full text-teal-600 mb-2">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Historial Clínico</h2>
          <p className="text-slate-500">Selecciona una mascota para ver su historial clínico completo.</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Filtrar por nombre, propietario o raza..." 
                className="pl-10 h-11 text-lg"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPets.map((pet) => (
                <Card 
                  key={pet.id} 
                  className="cursor-pointer hover:shadow-md hover:border-teal-300 transition-all group"
                  onClick={() => handleSelectPet(pet)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-slate-100 group-hover:border-teal-100">
                      <AvatarImage src={pet.foto} />
                      <AvatarFallback className="bg-slate-100">
                        {pet.especie === 'Felino' ? <Cat className="w-8 h-8 text-slate-400" /> : <Dog className="w-8 h-8 text-slate-400" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{pet.nombre}</h3>
                      <p className="text-sm text-slate-500">{pet.especie} • {pet.raza}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> {pet.propietario}
                      </p>
                    </div>
                    <div className="ml-auto text-right text-xs text-slate-400">
                      <p>Última visita</p>
                      <p className="font-medium text-slate-600">{pet.ultimaVisita || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <SearchX className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{filterTerm ? 'No se encontraron mascotas con ese filtro.' : 'No hay mascotas registradas.'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="space-y-6">
        {/* Header with Pet Info */}
        <div className="flex items-start justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => setView('list')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="h-20 w-20 border-4 border-slate-50">
              <AvatarFallback className="bg-teal-100 text-teal-600 text-2xl font-bold">
                {selectedPet.nombre[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{selectedPet.nombre}</h2>
              <div className="flex items-center gap-3 text-slate-500 mt-1">
                <Badge variant="outline" className="bg-slate-50">{selectedPet.raza}</Badge>
                <span className="flex items-center gap-1 text-sm"><User className="w-4 h-4" /> {selectedPet.propietario}</span>
              </div>
            </div>
          </div>
          <Button onClick={() => setView('create')} className="bg-teal-600 hover:bg-teal-700 gap-2">
            <Plus className="w-4 h-4" /> Nuevo Registro
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-3.5 before:h-full before:w-0.5 before:bg-slate-200">
          {historyRecords.length === 0 ? (
            <div className="pl-8 text-slate-500 italic">No hay historial registrado.</div>
          ) : (
            historyRecords.map((record) => (
              <div key={record.id} className="relative">
                <div className="absolute -left-8 mt-1.5 h-7 w-7 rounded-full border-4 border-white bg-teal-500 flex items-center justify-center shadow-sm">
                  <HistoryIcon className="h-3 w-3 text-white" />
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
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">Consulta General</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 grid gap-4">
                    {/* Vital Signs Row */}
                    <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Weight className="w-4 h-4 text-slate-400" /> 
                        <span className="font-semibold">{record.peso} kg</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Thermometer className="w-4 h-4 text-red-400" /> 
                        <span className="font-semibold">{record.temperatura}°C</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                          <Stethoscope className="w-4 h-4 text-teal-500" /> Diagnóstico
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-md">
                          {record.diagnostico}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-amber-500" /> Tratamiento
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-md">
                          {record.tratamiento}
                        </p>
                      </div>
                    </div>

                    {(record.medicamentos || record.medicamentosRecetados) && (
                      <div className="mt-2 pt-3 border-t border-slate-100">
                         <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-2">
                          <Pill className="w-4 h-4 text-purple-500" /> Receta
                        </h4>
                        <p className="text-sm text-slate-600 italic">
                          {record.medicamentos || record.medicamentosRecetados}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setView('history')}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Cancelar
          </Button>
          <h2 className="text-xl font-bold text-slate-800">Nuevo Registro Clínico</h2>
        </div>

        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100">
             <div className="flex justify-between">
               <div>
                  <CardTitle>{selectedPet.nombre}</CardTitle>
                  <CardDescription>Consulta del {new Date().toLocaleDateString()}</CardDescription>
               </div>
             </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmitRecord} className="space-y-6">
              
              {/* Signos Vitales */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Signos Vitales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label>Peso (kg)</Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="number" step="0.1" className="pl-9" placeholder="0.0"
                        value={newRecord.peso}
                        onChange={e => setNewRecord({...newRecord, peso: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Temp (°C)</Label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="number" step="0.1" className="pl-9" placeholder="38.0"
                        value={newRecord.temperatura}
                        onChange={e => setNewRecord({...newRecord, temperatura: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>F. Card. (lpm)</Label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="number" className="pl-9" placeholder="80"
                        value={newRecord.frecuenciaCardiaca}
                        onChange={e => setNewRecord({...newRecord, frecuenciaCardiaca: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>F. Resp. (rpm)</Label>
                    <div className="relative">
                      <Wind className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        type="number" className="pl-9" placeholder="20"
                        value={newRecord.frecuenciaRespiratoria}
                        onChange={e => setNewRecord({...newRecord, frecuenciaRespiratoria: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles Clínicos */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Diagnóstico</Label>
                  <Textarea 
                    placeholder="Describa los hallazgos y el diagnóstico..."
                    className="min-h-[100px]"
                    value={newRecord.diagnostico}
                    onChange={e => setNewRecord({...newRecord, diagnostico: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Activity className="w-4 h-4" /> Tratamiento</Label>
                  <Textarea 
                    placeholder="Plan de tratamiento y procedimientos..."
                    className="min-h-[80px]"
                    value={newRecord.tratamiento}
                    onChange={e => setNewRecord({...newRecord, tratamiento: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Adicionales */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Microscope className="w-4 h-4" /> Exámenes Realizados</Label>
                  <Textarea 
                    placeholder="Lista de exámenes..."
                    value={newRecord.examenesRealizados}
                    onChange={e => setNewRecord({...newRecord, examenesRealizados: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Pill className="w-4 h-4" /> Medicamentos</Label>
                  <Textarea 
                    placeholder="Receta médica..."
                    value={newRecord.medicamentosRecetados}
                    onChange={e => setNewRecord({...newRecord, medicamentosRecetados: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => setView('history')}>Cancelar</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Registro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ClinicalHistory;
