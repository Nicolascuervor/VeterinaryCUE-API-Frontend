import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Loader2, CheckCircle, XCircle, AlertCircle, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const CheckoutForm = ({ ownerId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'idle', 'processing', 'succeeded', 'failed'
  
  // Form data
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    // Iniciar checkout al montar el componente
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const token = localStorage.getItem('jwtToken');
      console.log('🛒 [CHECKOUT] Iniciando checkout para usuario:', ownerId);
      
      const response = await fetch('https://api.veterinariacue.com/api/pedidos/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': ownerId || '',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('🛒 [CHECKOUT] Error del backend:', errorMessage);
        throw new Error(errorMessage || 'Error al iniciar el checkout');
      }

      const data = await response.json();
      console.log('🛒 [CHECKOUT] Datos recibidos:', {
        pedidoId: data.pedidoId,
        clientSecret: data.clientSecret ? data.clientSecret.substring(0, 30) + '...' : 'NO RECIBIDO'
      });
      
      if (!data.pedidoId) {
        throw new Error('No se recibió el pedidoId del backend');
      }

      if (!data.clientSecret) {
        throw new Error('No se recibió el clientSecret del backend');
      }
      
      // Detectar si es modo simulación (clientSecret empieza con "pi_simulated_")
      const isSimulatedMode = data.clientSecret.startsWith('pi_simulated_');
      setIsSimulated(isSimulatedMode);
      
      setPedidoId(data.pedidoId);
      setClientSecret(data.clientSecret);
      
      if (isSimulatedMode) {
        console.log('🔧 [CHECKOUT] Modo simulación detectado');
      }
    } catch (error) {
      console.error('🛒 [CHECKOUT] Error initializing checkout:', error);
      setError(error.message || 'Error al iniciar el proceso de pago');
      toast({
        title: "Error",
        description: error.message || 'No se pudo iniciar el proceso de pago.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Validar formato de tarjeta
  const validateCard = () => {
    // Limpiar espacios y guiones del número de tarjeta
    const cleanCardNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    
    // Validar número de tarjeta (debe tener 13-19 dígitos)
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return 'El número de tarjeta debe tener entre 13 y 19 dígitos';
    }

    // Validar nombre
    if (!cardName.trim() || cardName.trim().length < 3) {
      return 'El nombre del titular es requerido (mínimo 3 caracteres)';
    }

    // Validar fecha de expiración (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return 'La fecha de expiración debe tener el formato MM/YY';
    }

    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) {
      return 'El mes debe estar entre 01 y 12';
    }

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return 'La tarjeta ha expirado';
    }

    // Validar CVV (3 o 4 dígitos)
    if (!/^\d{3,4}$/.test(cvv)) {
      return 'El CVV debe tener 3 o 4 dígitos';
    }

    return null;
  };

  // Formatear número de tarjeta mientras se escribe
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  // Formatear fecha de expiración mientras se escribe
  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // Máximo 16 dígitos + 3 espacios
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) { // MM/YY
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const confirmSimulatedPayment = async () => {
    // Confirmar el pago simulado con el backend
    // Según la documentación, hay dos opciones:
    // 1. POST /api/pedidos/simulate/payment/{pedidoId} (más simple)
    // 2. POST /api/pedidos/simulate/payment/confirm?paymentIntentId={clientSecret}
    // Usaremos la opción 1 que es más directa
    
    const token = localStorage.getItem('jwtToken');
    
    try {
      console.log('💳 [PAGO] Confirmando pago simulado con backend:', {
        pedidoId,
        clientSecret: clientSecret ? clientSecret.substring(0, 30) + '...' : 'NO DISPONIBLE'
      });

      const response = await fetch(
        `https://api.veterinariacue.com/api/pedidos/simulate/payment/${pedidoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('💳 [PAGO] Error del backend:', errorText);
        throw new Error(errorText || 'Error al confirmar el pago simulado');
      }

      const result = await response.json();
      console.log('💳 [PAGO] Respuesta del backend:', result);

      if (!result.success) {
        throw new Error(result.message || 'El pago no pudo ser confirmado');
      }

      return result;
    } catch (error) {
      console.error('💳 [PAGO] Error al confirmar pago simulado:', error);
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validar formulario
    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      toast({
        title: "Error de Validación",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    if (!pedidoId) {
      setError('No se pudo obtener el ID del pedido. Por favor, intenta nuevamente.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStatus('processing');

    try {
      console.log('💳 [PAGO] Iniciando procesamiento de pago');
      
      if (isSimulated) {
        // Modo simulación: llamar directamente al endpoint del backend
        console.log('💳 [PAGO] Usando modo simulación del backend');
        
        const result = await confirmSimulatedPayment();
        
        if (result.success) {
          // Pago exitoso
          setPaymentStatus('succeeded');
          toast({
            title: "Pago Exitoso",
            description: result.message || "Tu pedido ha sido procesado correctamente. El stock se actualizará automáticamente.",
          });
          
          // Esperar un momento antes de cerrar para que el usuario vea el mensaje
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          throw new Error(result.message || 'El pago no pudo ser procesado');
        }
      } else {
        // Modo real: aquí iría la integración con Stripe real
        // Por ahora, mostramos un error ya que no tenemos Stripe configurado
        throw new Error('El modo de pago real (Stripe) no está disponible. Por favor, activa el modo simulación en el backend.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus('failed');
      setError(error.message || 'Error al procesar el pago. Por favor, intenta nuevamente.');
      toast({
        title: "Error en el Pago",
        description: error.message || 'No se pudo procesar el pago. Por favor, intenta nuevamente.',
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">¡Pago Exitoso!</h3>
        <p className="text-slate-600 mb-4">Tu pedido #{pedidoId} ha sido procesado correctamente.</p>
        <p className="text-sm text-slate-500">El stock se actualizará automáticamente y recibirás una confirmación por correo.</p>
      </div>
    );
  }

  if (isProcessing && !pedidoId) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-slate-600">Iniciando proceso de pago...</p>
      </div>
    );
  }

  if (error && !pedidoId) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al Iniciar el Pago</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={initializeCheckout} className="bg-teal-600 hover:bg-teal-700 text-white">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-slate-600" />
          <p className="text-sm font-semibold text-slate-900">Pago Seguro</p>
        </div>
        <p className="text-xs text-slate-600">
          Tu información de pago está protegida. Esta es una pasarela de pagos simulada para fines de demostración.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-number" className="text-slate-900">
            Número de Tarjeta
          </Label>
          <Input
            id="card-number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            disabled={isProcessing}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-name" className="text-slate-900">
            Nombre del Titular
          </Label>
          <Input
            id="card-name"
            type="text"
            placeholder="Juan Pérez"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            disabled={isProcessing}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry-date" className="text-slate-900">
              Fecha de Expiración
            </Label>
            <Input
              id="expiry-date"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryChange}
              maxLength={5}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-slate-900">
              CVV
            </Label>
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
              maxLength={4}
              disabled={isProcessing}
              className="font-mono"
            />
          </div>
        </div>

        {error && paymentStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
      </div>

      {isSimulated ? (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-semibold mb-2">💡 Modo Simulación Activado</p>
          <p className="text-xs text-blue-700">
            El backend está configurado en modo simulación. Puedes usar cualquier número de tarjeta válido (13-19 dígitos) 
            para completar la compra. El pago será procesado por el backend en modo simulado.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Modo Real (Stripe)</p>
          <p className="text-xs text-yellow-700">
            El backend está configurado para usar Stripe real. Asegúrate de tener Stripe correctamente configurado.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isProcessing || !pedidoId}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar Ahora
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const CheckoutDialog = ({ open, onOpenChange, ownerId, onSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Procesar Pago
          </DialogTitle>
          <DialogDescription>
            Completa la información de pago para finalizar tu compra.
          </DialogDescription>
        </DialogHeader>

        <CheckoutForm 
          ownerId={ownerId} 
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
