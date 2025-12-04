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
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QZ...');

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
        throw new Error(errorMessage || 'Error al iniciar el checkout');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPedidoId(data.pedidoId);
    } catch (error) {
      console.error('Error initializing checkout:', error);
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

    try {
      // Confirmar el pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        // Error de Stripe (tarjeta rechazada, etc.)
        setPaymentStatus('failed');
        setError(stripeError.message);
        toast({
          title: "Error en el Pago",
          description: stripeError.message,
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

        // Reintentar confirmación después de la acción
        const { error: retryError, paymentIntent: retryPaymentIntent } = 
          await stripe.confirmCardPayment(clientSecret);

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
      setError(error.message || 'Error al procesar el pago');
      toast({
        title: "Error",
        description: error.message || 'No se pudo procesar el pago. Por favor, intenta nuevamente.',
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
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;

