import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Pencil, Trash2, Search, Loader2, 
  Package, Upload, Edit, X, Check, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';

const InventoryProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    tipoProducto: 'ALIMENTO',
    nombre: '',
    descripcion: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
    ubicacion: '',
    disponibleParaVenta: true,
    categoriaId: '',
    // Campos específicos por tipo
    tipoMascota: '',
    pesoEnKg: '',
    composicion: '',
    dosisRecomendada: '',
    material: '',
    tamanio: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({ stock: '', disponibleParaVenta: true });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/inventario/productos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Error al cargar los productos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://api.veterinariacue.com/api/inventario/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getProductImageUrl = (foto) => {
    if (!foto) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    const filename = foto.split('/').pop() || foto;
    return `https://api.veterinariacue.com/api/inventario/uploads/${filename}`;
  };

  const getProductTypeLabel = (tipo) => {
    const types = {
      'ALIMENTO': 'Alimento',
      'MEDICINA': 'Medicina',
      'ACCESORIO': 'Accesorio',
      'KIT': 'Kit'
    };
    return types[tipo] || tipo;
  };

  const getProductTypeColor = (tipo) => {
    const colors = {
      'ALIMENTO': 'bg-green-100 text-green-800 border-green-200',
      'MEDICINA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACCESORIO': 'bg-purple-100 text-purple-800 border-purple-200',
      'KIT': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[tipo] || 'bg-slate-100 text-slate-800';
  };

  const handleCreate = () => {
    setCurrentProduct(null);
    setFormData({
      tipoProducto: 'ALIMENTO',
      nombre: '',
      descripcion: '',
      precio: '',
      stockActual: '',
      stockMinimo: '',
      ubicacion: '',
      disponibleParaVenta: true,
      categoriaId: '',
      tipoMascota: '',
      pesoEnKg: '',
      composicion: '',
      dosisRecomendada: '',
      material: '',
      tamanio: ''
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    const tipoProducto = product.tipoProducto || 'ALIMENTO';
    setFormData({
      tipoProducto,
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: product.precio || '',
      stockActual: product.stockActual || '',
      stockMinimo: product.stockMinimo || '',
      ubicacion: product.ubicacion || '',
      disponibleParaVenta: product.disponibleParaVenta !== undefined ? product.disponibleParaVenta : true,
      categoriaId: product.categoria?.id || '',
      tipoMascota: product.tipoMascota || '',
      pesoEnKg: product.pesoEnKg || '',
      composicion: product.composicion || '',
      dosisRecomendada: product.dosisRecomendada || '',
      material: product.material || '',
      tamanio: product.tamanio || ''
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleStockUpdate = (product) => {
    setCurrentProduct(product);
    setStockUpdate({
      stock: product.stockActual || '',
      disponibleParaVenta: product.disponibleParaVenta !== undefined ? product.disponibleParaVenta : true
    });
    setIsStockModalOpen(true);
  };

  const handleImageUpload = (product) => {
    setCurrentProduct(product);
    setSelectedFile(null);
    setIsImageModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/inventario/productos/${currentProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Producto Eliminado",
          description: "El producto ha sido eliminado correctamente."
        });
        fetchProducts();
        setIsDeleteModalOpen(false);
        setCurrentProduct(null);
      } else {
        throw new Error("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        tipoProducto: formData.tipoProducto,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stockActual: parseInt(formData.stockActual),
        stockMinimo: parseInt(formData.stockMinimo) || 0,
        ubicacion: formData.ubicacion || '',
        disponibleParaVenta: formData.disponibleParaVenta,
        categoriaId: parseInt(formData.categoriaId)
      };

      // Agregar campos específicos según el tipo
      if (formData.tipoProducto === 'ALIMENTO') {
        payload.tipoMascota = formData.tipoMascota;
        payload.pesoEnKg = formData.pesoEnKg ? parseFloat(formData.pesoEnKg) : null;
      } else if (formData.tipoProducto === 'MEDICINA') {
        payload.composicion = formData.composicion;
        payload.dosisRecomendada = formData.dosisRecomendada;
      } else if (formData.tipoProducto === 'ACCESORIO') {
        payload.material = formData.material;
        payload.tamanio = formData.tamanio;
      }

      let endpoint = '';
      if (currentProduct) {
        // Actualizar
        if (formData.tipoProducto === 'ALIMENTO') {
          endpoint = `https://api.veterinariacue.com/api/inventario/productos/alimento/${currentProduct.id}`;
        } else if (formData.tipoProducto === 'MEDICINA') {
          endpoint = `https://api.veterinariacue.com/api/inventario/productos/medicina/${currentProduct.id}`;
        } else if (formData.tipoProducto === 'ACCESORIO') {
          endpoint = `https://api.veterinariacue.com/api/inventario/productos/accesorio/${currentProduct.id}`;
        } else {
          endpoint = `https://api.veterinariacue.com/api/inventario/productos/${currentProduct.id}`;
        }

        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          toast({
            title: "Producto Actualizado",
            description: "El producto ha sido actualizado correctamente."
          });
          fetchProducts();
          setIsModalOpen(false);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Error al actualizar el producto' }));
          throw new Error(errorData.message || 'Error al actualizar el producto');
        }
      } else {
        // Crear
        endpoint = `https://api.veterinariacue.com/api/inventario/productos/${formData.tipoProducto.toLowerCase()}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          toast({
            title: "Producto Creado",
            description: "El producto ha sido creado correctamente."
          });
          fetchProducts();
          setIsModalOpen(false);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Error al crear el producto' }));
          throw new Error(errorData.message || 'Error al crear el producto');
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto.",
        variant: "destructive"
      });
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Actualizar stock
      if (stockUpdate.stock !== '') {
        const stockResponse = await fetch(
          `https://api.veterinariacue.com/api/inventario/productos/${currentProduct.id}/stock?stock=${parseInt(stockUpdate.stock)}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!stockResponse.ok) {
          throw new Error("Error al actualizar el stock");
        }
      }

      // Actualizar disponibilidad
      const disponibilidadResponse = await fetch(
        `https://api.veterinariacue.com/api/inventario/productos/${currentProduct.id}/disponibilidad?disponibleParaVenta=${stockUpdate.disponibleParaVenta}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (disponibilidadResponse.ok) {
        toast({
          title: "Actualizado",
          description: "El stock y disponibilidad han sido actualizados."
        });
        fetchProducts();
        setIsStockModalOpen(false);
        setCurrentProduct(null);
      } else {
        throw new Error("Error al actualizar la disponibilidad");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock.",
        variant: "destructive"
      });
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen.",
        variant: "destructive"
      });
      return;
    }

    // Validar que sea una imagen
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen (JPEG, PNG, etc.).",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (selectedFile.size > maxSize) {
      toast({
        title: "Error",
        description: "La imagen es demasiado grande. El tamaño máximo es 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: "Error",
          description: "No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.",
          variant: "destructive"
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `https://api.veterinariacue.com/api/inventario/productos/${currentProduct.id}/upload-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // NO establecer Content-Type manualmente - el navegador lo hace automáticamente para FormData
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.text(); // El backend devuelve un string con la URL
        toast({
          title: "Imagen Subida",
          description: "La imagen ha sido subida correctamente."
        });
        fetchProducts();
        setIsImageModalOpen(false);
        setCurrentProduct(null);
        setSelectedFile(null);
      } else {
        // Intentar obtener el mensaje de error del backend
        let errorMessage = "Error al subir la imagen";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        console.error("Error uploading image:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage
        });
        
        toast({
          title: "Error",
          description: errorMessage || `Error ${response.status}: ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen. Verifica tu conexión e intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-teal-600" />
            Gestión de Productos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Administra el inventario de productos.</p>
        </div>
        <Button onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
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
                  <TableHead className="text-slate-900">Imagen</TableHead>
                  <TableHead className="text-slate-900">Nombre</TableHead>
                  <TableHead className="text-slate-900">Tipo</TableHead>
                  <TableHead className="text-slate-900">Categoría</TableHead>
                  <TableHead className="text-slate-900">Precio</TableHead>
                  <TableHead className="text-slate-900">Stock</TableHead>
                  <TableHead className="text-slate-900">Disponible</TableHead>
                  <TableHead className="text-right text-slate-900">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const imageUrl = getProductImageUrl(product.foto);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={product.nombre}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-slate-100 rounded flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{product.nombre}</TableCell>
                        <TableCell>
                          <Badge className={getProductTypeColor(product.tipoProducto)}>
                            {getProductTypeLabel(product.tipoProducto)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-900">{product.categoria?.nombre || '-'}</TableCell>
                        <TableCell className="text-slate-900">${product.precio?.toLocaleString('es-CO')}</TableCell>
                        <TableCell className="text-slate-900">
                          <span className={product.stockActual < (product.stockMinimo || 0) ? 'text-red-600 font-semibold' : ''}>
                            {product.stockActual || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.disponibleParaVenta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {product.disponibleParaVenta ? 'Sí' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStockUpdate(product)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImageUpload(product)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                      No se encontraron productos.
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {currentProduct ? 'Modifica la información del producto.' : 'Completa los datos para crear un nuevo producto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipoProducto">Tipo de Producto *</Label>
                <select
                  id="tipoProducto"
                  className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={formData.tipoProducto}
                  onChange={(e) => setFormData({...formData, tipoProducto: e.target.value})}
                  required
                  disabled={!!currentProduct}
                >
                  <option value="ALIMENTO">Alimento</option>
                  <option value="MEDICINA">Medicina</option>
                  <option value="ACCESORIO">Accesorio</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoriaId">Categoría *</Label>
                <select
                  id="categoriaId"
                  className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

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

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="precio">Precio *</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockActual">Stock Actual *</Label>
                <Input
                  id="stockActual"
                  type="number"
                  value={formData.stockActual}
                  onChange={(e) => setFormData({...formData, stockActual: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  value={formData.stockMinimo}
                  onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="disponibleParaVenta"
                  checked={formData.disponibleParaVenta}
                  onCheckedChange={(checked) => setFormData({...formData, disponibleParaVenta: checked})}
                />
                <Label htmlFor="disponibleParaVenta">Disponible para Venta</Label>
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {formData.tipoProducto === 'ALIMENTO' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipoMascota">Tipo de Mascota</Label>
                  <Input
                    id="tipoMascota"
                    value={formData.tipoMascota}
                    onChange={(e) => setFormData({...formData, tipoMascota: e.target.value})}
                    placeholder="Ej: Perro, Gato"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pesoEnKg">Peso (kg)</Label>
                  <Input
                    id="pesoEnKg"
                    type="number"
                    step="0.1"
                    value={formData.pesoEnKg}
                    onChange={(e) => setFormData({...formData, pesoEnKg: e.target.value})}
                  />
                </div>
              </div>
            )}

            {formData.tipoProducto === 'MEDICINA' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="composicion">Composición</Label>
                  <Input
                    id="composicion"
                    value={formData.composicion}
                    onChange={(e) => setFormData({...formData, composicion: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dosisRecomendada">Dosis Recomendada</Label>
                  <Input
                    id="dosisRecomendada"
                    value={formData.dosisRecomendada}
                    onChange={(e) => setFormData({...formData, dosisRecomendada: e.target.value})}
                  />
                </div>
              </div>
            )}

            {formData.tipoProducto === 'ACCESORIO' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tamanio">Tamaño</Label>
                  <Input
                    id="tamanio"
                    value={formData.tamanio}
                    onChange={(e) => setFormData({...formData, tamanio: e.target.value})}
                    placeholder="Ej: S, M, L"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                {currentProduct ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{currentProduct?.nombre}"? Esta acción no se puede deshacer.
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

      {/* Stock Update Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Stock y Disponibilidad</DialogTitle>
            <DialogDescription>
              Actualiza el stock y disponibilidad del producto "{currentProduct?.nombre}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Actual</Label>
              <Input
                id="stock"
                type="number"
                value={stockUpdate.stock}
                onChange={(e) => setStockUpdate({...stockUpdate, stock: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="disponibleParaVenta"
                checked={stockUpdate.disponibleParaVenta}
                onCheckedChange={(checked) => setStockUpdate({...stockUpdate, disponibleParaVenta: checked})}
              />
              <Label htmlFor="disponibleParaVenta">Disponible para Venta</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Imagen del Producto</DialogTitle>
            <DialogDescription>
              Selecciona una imagen para el producto "{currentProduct?.nombre}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImageSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Imagen</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
            </div>
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">Vista previa:</p>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded border"
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImageModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={!selectedFile}>
                Subir Imagen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryProducts;

