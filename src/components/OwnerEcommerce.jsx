
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package,
  Loader2,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const OwnerEcommerce = ({ ownerId }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchCart();
  }, [ownerId]);

  useEffect(() => {
    // Debounce para búsqueda
    const timer = setTimeout(() => {
      if (filterTerm.trim() || selectedCategory !== 'todas') {
        searchProducts();
      } else {
        fetchProducts();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filterTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://api.veterinariacue.com/api/inventario/categorias/public');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Error fetching categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.veterinariacue.com/api/inventario/productos/public/disponibles');
      
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

  const searchProducts = async () => {
    setIsLoading(true);
    try {
      let url = '';
      
      if (filterTerm.trim() && selectedCategory !== 'todas') {
        // Búsqueda avanzada con filtros
        const categoryId = selectedCategory;
        url = `https://api.veterinariacue.com/api/inventario/productos/public/filtrar?nombre=${encodeURIComponent(filterTerm)}&categoriaId=${categoryId}&page=0&size=100`;
      } else if (filterTerm.trim()) {
        // Búsqueda por nombre
        url = `https://api.veterinariacue.com/api/inventario/productos/public/buscar?nombre=${encodeURIComponent(filterTerm)}&page=0&size=100`;
      } else if (selectedCategory !== 'todas') {
        // Filtro por categoría
        const categoryId = selectedCategory;
        url = `https://api.veterinariacue.com/api/inventario/productos/public/categoria/${categoryId}?page=0&size=100`;
      } else {
        fetchProducts();
        return;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Si la respuesta es paginada, extraer el contenido
        const productList = data.content || data;
        setProducts(Array.isArray(productList) ? productList : []);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron buscar los productos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching products:", error);
      toast({
        title: "Error",
        description: "Error al buscar productos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCart = async () => {
    setIsCartLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/carrito', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': ownerId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        // Cart might not exist yet, that's ok
        setCart({ items: [], total: 0 });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart({ items: [], total: 0 });
    } finally {
      setIsCartLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/carrito/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': ownerId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productoId: productId,
          cantidad: quantity
        })
      });

      if (response.ok) {
        toast({
          title: "Producto Agregado",
          description: "El producto se agregó al carrito correctamente."
        });
        fetchCart();
      } else {
        throw new Error("Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito.",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`https://api.veterinariacue.com/api/carrito/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': ownerId
        }
      });

      if (response.ok) {
        toast({
          title: "Producto Eliminado",
          description: "El producto se eliminó del carrito."
        });
        fetchCart();
      } else {
        throw new Error("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive"
      });
    }
  };

  const updateCartItem = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Remove and re-add with new quantity
    await removeFromCart(productId);
    await addToCart(productId, newQuantity);
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('https://api.veterinariacue.com/api/carrito', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Usuario-Id': ownerId
        }
      });

      if (response.ok) {
        toast({
          title: "Carrito Vacío",
          description: "Todos los productos fueron eliminados."
        });
        fetchCart();
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getProductImageUrl = (foto) => {
    if (!foto) return null;
    // Si ya es una URL completa, retornarla
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    // Si es un nombre de archivo, construir la URL del endpoint de imágenes
    const filename = foto.split('/').pop() || foto;
    return `https://api.veterinariacue.com/api/inventario/uploads/${filename}`;
  };

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
  const cartTotal = cart?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-teal-600" />
            Tienda
          </h2>
          <p className="text-slate-500 text-sm mt-1">Explora y compra productos para tus mascotas.</p>
        </div>
        <Button 
          onClick={() => setIsCartOpen(true)} 
          className="bg-teal-600 hover:bg-teal-700 text-white relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Carrito
          {cartItemCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">{cartItemCount}</Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Buscar productos..." 
                className="pl-10"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select 
                className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay productos disponibles</h3>
            <p className="text-slate-500">No se encontraron productos con los filtros seleccionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const cartItem = cart?.items?.find(item => item.productoId === product.id);
            const inCart = !!cartItem;
            const imageUrl = getProductImageUrl(product.foto);

            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                {imageUrl && (
                  <div className="w-full h-48 bg-slate-100 rounded-t-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    {product.categoria && (
                      <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                        {product.categoria.nombre}
                      </Badge>
                    )}
                    {product.stockActual < 10 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Poco Stock
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{product.nombre}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.descripcion || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                      <DollarSign className="w-5 h-5" />
                      ${product.precio?.toLocaleString('es-CO')}
                    </span>
                    <span className="text-sm text-slate-500">Stock: {product.stockActual || 0}</span>
                  </div>

                  {inCart ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-teal-50 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartItem(product.id, cartItem.cantidad - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-slate-900">{cartItem.cantidad}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartItem(product.id, cartItem.cantidad + 1)}
                          disabled={cartItem.cantidad >= (product.stockActual || 0)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => addToCart(product.id)}
                      disabled={!product.disponibleParaVenta || (product.stockActual || 0) === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mi Carrito</DialogTitle>
          </DialogHeader>

          {isCartLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : !cart?.items || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Tu carrito está vacío</h3>
              <p className="text-slate-500">Agrega productos para comenzar tu compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => {
                const product = products.find(p => p.id === item.productoId);
                if (!product) return null;

                return (
                  <Card key={item.productoId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{product.nombre}</h4>
                          <p className="text-sm text-slate-500">
                            ${product.precio?.toLocaleString('es-CO')} x {item.cantidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateCartItem(item.productoId, item.cantidad - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold text-slate-900 w-8 text-center">{item.cantidad}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateCartItem(item.productoId, item.cantidad + 1)}
                              disabled={item.cantidad >= (product.stockActual || 0)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="font-bold text-slate-900 w-24 text-right">
                            ${(product.precio * item.cantidad).toLocaleString('es-CO')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.productoId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total:</span>
                  <span className="text-teal-600">${cartTotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearCart}
                  >
                    Vaciar Carrito
                  </Button>
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => {
                      toast({
                        title: "Funcionalidad en Desarrollo",
                        description: "El proceso de pago estará disponible pronto."
                      });
                    }}
                  >
                    Proceder al Pago
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCartOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerEcommerce;

