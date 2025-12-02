
import React, { useState, useEffect } from 'react';
import { 
  PawPrint, 
  Plus, 
  Edit, 
  Trash2, 
  Dog, 
  Cat, 
  Loader2,
  User,
  Calendar,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const OwnerPets = ({ ownerId, onUpdate }) => {
  const { toast } = useToast();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    especie: 'Canino',
    raza: '',
    fechaNacimiento: '',
    peso: '',
    sexo: 'Macho',
    color: '',
    observaciones: ''
  });

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

  const handleOpenModal = (pet = null) => {
    if (pet) {
      setSelectedPet(pet);
      setIsEditing(true);
      setFormData({
        nombre: pet.nombre || '',
        especie: pet.especie || 'Canino',
        raza: pet.raza || '',
        fechaNacimiento: pet.fechaNacimiento ? pet.fechaNacimiento.split('T')[0] : '',
        peso: pet.peso || '',
        sexo: pet.sexo || 'Macho',
        color: pet.color || '',
        observaciones: pet.observaciones || ''
      });
    } else {
      setSelectedPet(null);
      setIsEditing(false);
      setFormData({
        nombre: '',
        especie: 'Canino',
        raza: '',
        fechaNacimiento: '',
        peso: '',
        sexo: 'Macho',
        color: '',
        observaciones: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        ...formData,
        duenioId: ownerId,
        activo: true
      };

      const url = isEditing 
        ? `https://api.veterinariacue.com/api/mascotas/${selectedPet.id}`
        : 'https://api.veterinariacue.com/api/mascotas';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: isEditing ? "Mascota actualizada correctamente." : "Mascota registrada correctamente."
        });
        setIsModalOpen(false);
        fetchPets();
        if (onUpdate) onUpdate();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Error al guardar la mascota");
      }
    } catch (error) {
      console.error("Error saving pet:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la mascota.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta mascota?')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/mascotas/${petId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: "Mascota Eliminada",
          description: "La mascota ha sido eliminada correctamente."
        });
        fetchPets();
        if (onUpdate) onUpdate();
      } else {
        throw new Error("Error al eliminar la mascota");
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la mascota.",
        variant: "destructive"
      });
    }
  };

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
            <PawPrint className="w-6 h-6 text-teal-600" />
            Mis Mascotas
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona la información de tus mascotas registradas.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Mascota
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <PawPrint className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No tienes mascotas registradas</h3>
            <p className="text-slate-500 mb-4">Comienza registrando tu primera mascota.</p>
            <Button onClick={() => handleOpenModal()} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primera Mascota
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 border-2 border-slate-100">
                      <AvatarImage src={pet.foto} />
                      <AvatarFallback className="bg-slate-100">
                        {pet.especie === 'Felino' ? <Cat className="w-8 h-8 text-slate-400" /> : <Dog className="w-8 h-8 text-slate-400" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{pet.nombre}</CardTitle>
                      <CardDescription>{pet.especie} • {pet.raza}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    {pet.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pet.fechaNacimiento && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Nacimiento: {new Date(pet.fechaNacimiento).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {pet.peso && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Heart className="w-4 h-4" />
                    <span>Peso: {pet.peso} kg</span>
                  </div>
                )}
                {pet.sexo && (
                  <div className="text-sm text-slate-600">
                    <span>Sexo: {pet.sexo}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleOpenModal(pet)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(pet.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Pet Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Mascota' : 'Registrar Nueva Mascota'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Actualiza la información de tu mascota.' : 'Completa la información para registrar una nueva mascota.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input 
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  className="text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especie">Especie <span className="text-red-500">*</span></Label>
                <select 
                  id="especie"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  value={formData.especie}
                  onChange={(e) => setFormData({...formData, especie: e.target.value})}
                  required
                >
                  <option value="Canino">Canino</option>
                  <option value="Felino">Felino</option>
                  <option value="Ave">Ave</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="raza">Raza</Label>
                <Input 
                  id="raza"
                  value={formData.raza}
                  onChange={(e) => setFormData({...formData, raza: e.target.value})}
                  className="text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <select 
                  id="sexo"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  value={formData.sexo}
                  onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                >
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input 
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                  className="text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input 
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => setFormData({...formData, peso: e.target.value})}
                  className="text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input 
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea 
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                className="min-h-[80px] text-slate-900"
                placeholder="Información adicional sobre la mascota..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                {isEditing ? 'Actualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerPets;

