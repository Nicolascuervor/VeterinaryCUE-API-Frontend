import React, { useState, useEffect } from 'react';
import { 
  FolderTree, Plus, Pencil, Trash2, Search, Loader2, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';

const InventoryCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.veterinariacue.com/api/inventario/categorias');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Error al cargar las categorías.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentCategory(null);
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      nombre: category.nombre || '',
      descripcion: category.descripcion || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (category) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(
        `https://api.veterinariacue.com/api/inventario/categorias/${currentCategory.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        toast({
          title: "Categoría Eliminada",
          description: "La categoría ha sido eliminada correctamente."
        });
        fetchCategories();
        setIsDeleteModalOpen(false);
        setCurrentCategory(null);
      } else {
        throw new Error("Error al eliminar la categoría");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || ''
      };

      if (currentCategory) {
        // Actualizar
        const response = await fetch(
          `https://api.veterinariacue.com/api/inventario/categorias/${currentCategory.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        if (response.ok) {
          toast({
            title: "Categoría Actualizada",
            description: "La categoría ha sido actualizada correctamente."
          });
          fetchCategories();
          setIsModalOpen(false);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Error al actualizar la categoría' }));
          throw new Error(errorData.message || 'Error al actualizar la categoría');
        }
      } else {
        // Crear
        const response = await fetch(
          'https://api.veterinariacue.com/api/inventario/categorias',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        if (response.ok) {
          toast({
            title: "Categoría Creada",
            description: "La categoría ha sido creada correctamente."
          });
          fetchCategories();
          setIsModalOpen(false);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Error al crear la categoría' }));
          throw new Error(errorData.message || 'Error al crear la categoría');
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la categoría.",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-teal-600" />
            Gestión de Categorías
          </h2>
          <p className="text-slate-500 text-sm mt-1">Administra las categorías de productos.</p>
        </div>
        <Button onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-900">ID</TableHead>
                  <TableHead className="text-slate-900">Nombre</TableHead>
                  <TableHead className="text-slate-900">Descripción</TableHead>
                  <TableHead className="text-right text-slate-900">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-slate-900">{category.id}</TableCell>
                      <TableCell className="font-medium text-slate-900">{category.nombre}</TableCell>
                      <TableCell className="text-slate-900">{category.descripcion || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                      No se encontraron categorías.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>
              {currentCategory ? 'Modifica la información de la categoría.' : 'Completa los datos para crear una nueva categoría.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                {currentCategory ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría "{currentCategory?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryCategories;

