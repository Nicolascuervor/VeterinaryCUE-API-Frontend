import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  CreditCard, Loader2, CheckCircle, XCircle, AlertCircle, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Inicializar Stripe - Usar variable de entorno
// IMPORTANTE: Configura VITE_STRIPE_PUBLISHABLE_KEY en tu archivo .env
// Vite solo carga variables que empiezan con VITE_ y solo al iniciar el servidor
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
                   import.meta.env.STRIPE_PUBLISHABLE_KEY || // Fallback (no recomendado)
                   null;

// Validar que la clave esté configurada y sea válida
const isValidStripeKey = STRIPE_KEY && 
  typeof STRIPE_KEY === 'string' && 
  STRIPE_KEY.trim() !== '' && 
  STRIPE_KEY.startsWith('pk_') &&
  STRIPE_KEY !== 'pk_test_51QZ...' &&
  STRIPE_KEY !== 'pk_test_tu_clave_aqui';

if (!isValidStripeKey) {
  console.error('⚠️ VITE_STRIPE_PUBLISHABLE_KEY no está configurada correctamente.');
  console.error('Valor actual:', STRIPE_KEY || 'undefined');
  console.error('Tipo:', typeof STRIPE_KEY);
  console.error('Empieza con pk_:', STRIPE_KEY?.startsWith('pk_'));
  console.error('Por favor, verifica que:');
  console.error('1. El archivo .env existe en la raíz del proyecto');
  console.error('2. La variable se llama VITE_STRIPE_PUBLISHABLE_KEY (con VITE_ al inicio)');
  console.error('3. Has reiniciado el servidor de desarrollo después de crear/modificar el .env');
} else {
  console.log('✅ Stripe key configurada correctamente:', STRIPE_KEY.substring(0, 20) + '...');
}

// Solo inicializar Stripe si tenemos una clave válida
// loadStripe() devuelve una Promise que resuelve a una instancia de Stripe
// IMPORTANTE: loadStripe debe recibir la clave sin espacios ni caracteres extra
const stripeKeyClean = isValidStripeKey ? STRIPE_KEY.trim() : null;
const stripePromise = stripeKeyClean ? loadStripe(stripeKeyClean) : null;

// Log para debugging (solo en desarrollo)
if (import.meta.env.DEV && stripeKeyClean) {
  console.log('🔑 Stripe inicializado con clave:', stripeKeyClean.substring(0, 20) + '...');
  console.log('🔑 Longitud de la clave:', stripeKeyClean.length);
  console.log('🔑 Clave completa (solo para verificación):', stripeKeyClean);
  console.log('🔑 Caracteres especiales en la clave:', JSON.stringify(stripeKeyClean));
  console.log('🔑 Clave desde import.meta.env:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  console.log('🔑 Todas las variables VITE_*:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

const CheckoutForm = ({ ownerId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'succeeded', 'failed'

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
      console.log('🛒 [CHECKOUT] Token disponible:', !!token);
      
      const response = await fetch('https://api.veterinariacue.com/api/pedidos/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': ownerId || '',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      console.log('🛒 [CHECKOUT] Respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('🛒 [CHECKOUT] Error del backend:', errorMessage);
        throw new Error(errorMessage || 'Error al iniciar el checkout');
      }

      const data = await response.json();
      console.log('🛒 [CHECKOUT] Datos recibidos:', {
        pedidoId: data.pedidoId,
        clientSecret: data.clientSecret ? data.clientSecret.substring(0, 20) + '...' : 'NO RECIBIDO'
      });
      
      if (!data.clientSecret) {
        throw new Error('No se recibió el clientSecret del backend');
      }
      
      setClientSecret(data.clientSecret);
      setPedidoId(data.pedidoId);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStatus('processing');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('No se pudo obtener el elemento de tarjeta. Por favor, recarga la página.');
      setIsProcessing(false);
      return;
    }

    try {
      console.log('💳 [PAGO] Iniciando confirmación de pago');
      console.log('💳 [PAGO] ClientSecret recibido:', clientSecret ? clientSecret.substring(0, 20) + '...' : 'NO DISPONIBLE');
      console.log('💳 [PAGO] Stripe instance:', stripe ? 'Disponible' : 'NO DISPONIBLE');
      console.log('💳 [PAGO] CardElement:', cardElement ? 'Disponible' : 'NO DISPONIBLE');
      console.log('💳 [PAGO] Stripe key usado:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...' : 'NO DISPONIBLE');
      
      // IMPORTANTE: Usar stripe.confirmCardPayment() de Stripe.js
      // NO hacer fetch directo a https://api.stripe.com/v1/payment_intents/.../confirm
      // Stripe.js maneja internamente la comunicación con la API de Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Opcional: agregar detalles de facturación si están disponibles
            // name: 'Nombre del cliente',
            // email: 'email@example.com',
          }
        }
      });
      
      console.log('💳 [PAGO] Resultado de confirmCardPayment:', {
        error: stripeError ? {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message
        } : null,
        paymentIntent: paymentIntent ? {
          id: paymentIntent.id,
          status: paymentIntent.status
        } : null
      });

      if (stripeError) {
        // Error de Stripe (tarjeta rechazada, 401, etc.)
        setPaymentStatus('failed');
        
        // Mensaje más descriptivo para errores 401
        let errorMessage = stripeError.message;
        if (stripeError.type === 'api_error' || stripeError.code === 'api_key_expired') {
          errorMessage = 'La clave de Stripe no es válida. Por favor, verifica tu configuración.';
        }
        
        setError(errorMessage);
        console.error('Error de Stripe:', {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
          decline_code: stripeError.decline_code
        });
        
        toast({
          title: "Error en el Pago",
          description: errorMessage,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Pago exitoso
        setPaymentStatus('succeeded');
        toast({
          title: "Pago Exitoso",
          description: "Tu pedido ha sido procesado correctamente. El stock se actualizará automáticamente.",
        });
        
        // Esperar un momento antes de cerrar para que el usuario vea el mensaje
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (paymentIntent.status === 'requires_action') {
        // Requiere autenticación adicional (3D Secure)
        // handleCardAction maneja la autenticación 3D Secure automáticamente
        const { error: actionError } = await stripe.handleCardAction(clientSecret);
        
        if (actionError) {
          setPaymentStatus('failed');
          setError(actionError.message);
          toast({
            title: "Error en la Autenticación",
            description: actionError.message,
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        // Reintentar confirmación después de la acción usando Stripe.js
        const { error: retryError, paymentIntent: retryPaymentIntent } = 
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
            }
          });

        if (retryError) {
          setPaymentStatus('failed');
          setError(retryError.message);
          setIsProcessing(false);
          return;
        }

        if (retryPaymentIntent.status === 'succeeded') {
          setPaymentStatus('succeeded');
          toast({
            title: "Pago Exitoso",
            description: "Tu pedido ha sido procesado correctamente.",
          });
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        // Otro estado
        setPaymentStatus('failed');
        setError(`Estado del pago: ${paymentIntent.status}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus('failed');
      
      // Mensaje más descriptivo según el tipo de error
      let errorMessage = error.message || 'Error al procesar el pago';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Error de autenticación con Stripe. Por favor, verifica que tu clave pública (VITE_STRIPE_PUBLISHABLE_KEY) sea válida y esté correctamente configurada en el archivo .env';
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
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

  if (isProcessing && !clientSecret) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-slate-600">Iniciando proceso de pago...</p>
      </div>
    );
  }

  if (error && !clientSecret) {
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
          Tu información de pago está protegida con encriptación de nivel bancario.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-element" className="text-slate-900">
          Información de la Tarjeta
        </Label>
        <div className="p-4 border border-slate-200 rounded-lg bg-white">
          <CardElement
            id="card-element"
            options={cardElementOptions}
          />
        </div>
        {error && paymentStatus === 'failed' && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-semibold mb-1">Tarjetas de Prueba (Stripe Test Mode)</p>
        <p className="text-xs text-blue-700">
          <strong>Éxito:</strong> 4242 4242 4242 4242 | 
          <strong> 3D Secure:</strong> 4000 0025 0000 3155 | 
          <strong> Rechazada:</strong> 4000 0000 0000 0002
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Fecha: cualquier fecha futura | CVC: cualquier 3 dígitos
        </p>
      </div>

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
          disabled={!stripe || isProcessing || !clientSecret}
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
  const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  // Validar que la clave esté configurada y sea válida (misma validación que arriba)
  const isValidStripeKey = STRIPE_KEY && 
    typeof STRIPE_KEY === 'string' && 
    STRIPE_KEY.trim() !== '' && 
    STRIPE_KEY.startsWith('pk_') &&
    STRIPE_KEY !== 'pk_test_51QZ...' &&
    STRIPE_KEY !== 'pk_test_tu_clave_aqui';

  if (!isValidStripeKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Error de Configuración
            </DialogTitle>
            <DialogDescription>
              La clave de Stripe no está configurada correctamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ VITE_STRIPE_PUBLISHABLE_KEY no está configurada
              </p>
              <p className="text-sm text-red-700 mb-3">
                Por favor, crea un archivo <code className="bg-red-100 px-2 py-1 rounded">.env</code> en la raíz del proyecto con:
              </p>
              <pre className="bg-red-100 p-3 rounded text-xs text-red-900 overflow-x-auto">
                VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
              </pre>
              <p className="text-xs text-red-600 mt-3">
                Después de crear el archivo, reinicia el servidor de desarrollo.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              ownerId={ownerId} 
              onSuccess={() => {
                onSuccess();
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        ) : (
          <div className="py-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error al inicializar Stripe. Por favor, verifica tu configuración.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;

