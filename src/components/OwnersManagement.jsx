
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  PawPrint,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const OwnersManagement = () => {
  const { toast } = useToast();
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [expandedOwners, setExpandedOwners] = useState(new Set());
  const [ownerPets, setOwnerPets] = useState({}); // { ownerId: [pets] }

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/auth/active/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const allUsers = await response.json();
        // Filter only owners (DUENIO role)
        const ownersList = allUsers.filter(u => 
          u.userRole === 'ROLE_DUENIO' || 
          u.role === 'ROLE_DUENIO' || 
          u.tipoUsuario === 'DUENIO' ||
          (u.authorities && u.authorities.some(a => 
            (typeof a === 'string' ? a : a.authority) === 'ROLE_DUENIO'
          ))
        );
        setOwners(ownersList);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los dueños.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      toast({
        title: "Error",
        description: "Error al cargar los dueños.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwnerPets = async (ownerId) => {
    // If already fetched, don't fetch again
    if (ownerPets[ownerId]) return;

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/mascotas/owner/${ownerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const pets = await response.json();
        setOwnerPets(prev => ({ ...prev, [ownerId]: pets }));
      }
    } catch (error) {
      console.error("Error fetching pets for owner:", error);
    }
  };

  const toggleOwner = (ownerId) => {
    const newExpanded = new Set(expandedOwners);
    if (newExpanded.has(ownerId)) {
      newExpanded.delete(ownerId);
    } else {
      newExpanded.add(ownerId);
      fetchOwnerPets(ownerId);
    }
    setExpandedOwners(newExpanded);
  };

  const filteredOwners = owners.filter(owner => {
    const fullName = `${owner.nombre || ''} ${owner.apellido || ''}`.toLowerCase();
    const email = (owner.correo || '').toLowerCase();
    const phone = (owner.telefono || '').toLowerCase();
    const searchTerm = filterTerm.toLowerCase();
    
    return fullName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           phone.includes(searchTerm);
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
            <Users className="w-6 h-6 text-teal-600" />
            Gestión de Dueños
          </h2>
          <p className="text-slate-500 text-sm mt-1">Información de los dueños de mascotas registrados.</p>
        </div>
        <Badge variant="outline" className="text-slate-600">
          {owners.length} {owners.length === 1 ? 'Dueño' : 'Dueños'}
        </Badge>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre, correo o teléfono..." 
              className="pl-10"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Owners List */}
      {filteredOwners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {filterTerm ? 'No se encontraron dueños' : 'No hay dueños registrados'}
            </h3>
            <p className="text-slate-500">
              {filterTerm ? 'Intenta con otro término de búsqueda.' : 'Aún no hay dueños registrados en el sistema.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOwners.map((owner) => {
            const isExpanded = expandedOwners.has(owner.id);
            const pets = ownerPets[owner.id] || [];
            const hasPets = pets.length > 0;

            return (
              <Card key={owner.id} className="hover:shadow-md transition-shadow">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleOwner(owner.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-slate-100">
                        <AvatarImage src={owner.foto || ""} />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {(owner.nombre?.[0] || '') + (owner.apellido?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {owner.nombre} {owner.apellido}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {owner.correo}
                          </span>
                          {owner.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {owner.telefono}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPets && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <PawPrint className="w-3 h-3 mr-1" />
                          {pets.length} {pets.length === 1 ? 'mascota' : 'mascotas'}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOwner(owner.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    {/* Owner Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          Información Personal
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p><span className="font-medium">Nombre completo:</span> {owner.nombre} {owner.apellido}</p>
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="font-medium">Correo:</span> {owner.correo}
                          </p>
                          {owner.telefono && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span className="font-medium">Teléfono:</span> {owner.telefono}
                            </p>
                          )}
                          {owner.direccion && (
                            <p className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5" />
                              <span className="font-medium">Dirección:</span> {owner.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Información de Cuenta
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p><span className="font-medium">ID:</span> {owner.id}</p>
                          <p><span className="font-medium">Estado:</span> 
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              Activo
                            </Badge>
                          </p>
                          {owner.fechaCreacion && (
                            <p><span className="font-medium">Registrado:</span> {new Date(owner.fechaCreacion).toLocaleDateString('es-ES')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Owner's Pets */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-teal-600" />
                        Mascotas Registradas
                      </h4>
                      {pets.length === 0 ? (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <PawPrint className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Este dueño no tiene mascotas registradas.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {pets.map((pet) => (
                            <Card key={pet.id} className="border-slate-200 hover:border-teal-300 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="font-semibold text-slate-900">{pet.nombre}</h5>
                                    <p className="text-xs text-slate-500">{pet.especie} • {pet.raza}</p>
                                  </div>
                                  <Badge variant="outline" className={pet.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500'}>
                                    {pet.activo ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                                {pet.fechaNacimiento && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                                    <Calendar className="w-3 h-3" />
                                    Nacimiento: {new Date(pet.fechaNacimiento).toLocaleDateString('es-ES')}
                                  </p>
                                )}
                                {pet.peso && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Peso: {pet.peso} kg
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnersManagement;

