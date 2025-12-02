
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const OwnerProfile = ({ userId, onUpdate }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    id: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: '',
    foto: ''
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      
      if (!userId) throw new Error("Usuario no identificado");

      const response = await fetch(`https://api.veterinariacue.com/api/auth/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const profileData = {
            id: data.id,
            nombre: data.nombre || '',
            apellido: data.apellido || '',
            correo: data.correo || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            foto: data.foto || localStorage.getItem('userPhoto') || ''
        };

        setProfile(profileData);
        setFormData(profileData);
      } else {
        throw new Error("No se pudo cargar el perfil");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        direccion: formData.direccion
      };

      const response = await fetch(`https://api.veterinariacue.com/api/auth/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Perfil Actualizado",
          description: "Tu información ha sido actualizada correctamente."
        });
        setIsEditing(false);
        fetchProfile();
        if (onUpdate) onUpdate();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
            <User className="w-6 h-6 text-teal-600" />
            Mi Perfil
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona tu información personal.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-slate-100">
              <AvatarImage src={profile.foto || ""} />
              <AvatarFallback className="bg-teal-100 text-teal-700 text-3xl">
                {profile.nombre?.[0] || profile.apellido?.[0] || 'D'}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {profile.nombre} {profile.apellido}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Dueño de Mascotas</p>
            {isEditing && (
              <Button variant="outline" size="sm" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Cambiar Foto
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tus datos de contacto y dirección.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-slate-900">Nombre</Label>
                <Input 
                  id="nombre"
                  value={isEditing ? formData.nombre : profile.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  disabled={!isEditing}
                  className="text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-slate-900">Apellido</Label>
                <Input 
                  id="apellido"
                  value={isEditing ? formData.apellido : profile.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  disabled={!isEditing}
                  className="text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo" className="text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo Electrónico
              </Label>
              <Input 
                id="correo"
                value={profile.correo}
                disabled
                className="text-slate-500 bg-slate-50"
              />
              <p className="text-xs text-slate-400">El correo no se puede modificar.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </Label>
              <Input 
                id="telefono"
                value={isEditing ? formData.telefono : profile.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                disabled={!isEditing}
                className="text-slate-900"
                placeholder="Ej: 300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" className="text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección
              </Label>
              <Input 
                id="direccion"
                value={isEditing ? formData.direccion : profile.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                disabled={!isEditing}
                className="text-slate-900"
                placeholder="Ej: Calle 123 #45-67"
              />
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerProfile;

