
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Helper to parse JWT
const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error parsing JWT:", e);
    return null;
  }
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get API base URL from environment variable or use default
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.veterinariacue.com';

  const handleLogin = async (e) => {
    e.preventDefault();
    
    setDebugError(null);

    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu correo y contraseña.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Initiating login request to:", `${API_BASE_URL}/api/auth/login`); 
      
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          correo: email, 
          contrasenia: password 
        }),
        // Add mode and credentials for better CORS handling
        mode: 'cors',
        credentials: 'omit'
      });

      // Robust response handling
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        // Guardar detalles crudos para debug en UI (especialmente útil en mobile)
        setDebugError({
          type: 'RAW_RESPONSE',
          status: response.status,
          contentType,
          body: textData?.slice(0, 500) || null,
        });
        if (!response.ok) {
            throw new Error(textData || "Error en el servidor");
        }
        throw new Error("Formato de respuesta inválido del servidor");
      }

      if (response.ok) {
        // Store the token
        if (data.token) {
          console.log("Login successful. Token received."); 
          localStorage.setItem('jwtToken', data.token);
          
          // Decode token to extract user ID and role
          const decoded = parseJwt(data.token);
          console.log("Decoded JWT Payload:", decoded); 

          let userRole = null;
          if (decoded) {
            // 1. Extract User ID
            const userId = decoded.usuarioId || decoded.userId || decoded.id || decoded.sub;
            
            if (userId) {
              localStorage.setItem('userId', userId);
              console.log("User ID extracted:", userId);
            } else {
              console.warn("Could not extract user ID from token claims:", decoded);
            }
            
            // 2. Extract Role - UPDATED LOGIC FOR 'roles' ARRAY
            if (decoded.roles && Array.isArray(decoded.roles)) {
                // 'roles' array detected (e.g. ['ROLE_VETERINARIO'])
                // Prioritize specific roles for the purpose of dashboard routing
                if (decoded.roles.includes('ROLE_ADMIN')) {
                    userRole = 'ROLE_ADMIN';
                } else if (decoded.roles.includes('ROLE_VETERINARIO')) {
                    userRole = 'ROLE_VETERINARIO';
                } else if (decoded.roles.includes('ROLE_DUENIO')) {
                    userRole = 'ROLE_DUENIO';
                } else {
                    // Fallback to the first one if no standard role matches
                    userRole = decoded.roles[0];
                }
                console.log("Role extracted from 'roles' array:", userRole);
            } 
            // Fallback for other token formats
            else if (decoded.tipoUsuario) {
                userRole = decoded.tipoUsuario;
                console.log("Role found in 'tipoUsuario':", userRole);
            } else if (decoded.role) {
                userRole = decoded.role;
                console.log("Role found in 'role':", userRole);
            } else if (decoded.authorities && Array.isArray(decoded.authorities)) {
                const auth = decoded.authorities[0];
                userRole = (typeof auth === 'object') ? auth.authority : auth;
                console.log("Role found in 'authorities':", userRole);
            } else {
                console.warn("No recognized role field found in token.");
            }
            
            // Store full user info
            localStorage.setItem('userInfo', JSON.stringify({
               id: userId,
               email: decoded.sub || email,
               role: userRole
            }));
          } else {
            console.error("Failed to decode token.");
          }
          
          // Store user photo if available
          if (data.foto) {
            localStorage.setItem('userPhoto', data.foto);
          }

          if (rememberMe) {
            localStorage.setItem('savedEmail', email);
          }

          toast({
            title: "¡Bienvenido!",
            description: "Iniciando sesión correctamente."
          });

          // Redirect based on user role with robust string checking
          setTimeout(() => {
            const roleString = String(userRole || '').toUpperCase();
            console.log("Evaluating redirect for role string:", roleString);

            if (roleString.includes('VETERINARIO') || roleString.includes('VET')) {
              console.log("Redirecting -> /dashboard/veterinarian");
              navigate('/dashboard/veterinarian');
            } else if (roleString.includes('ADMIN')) {
              console.log("Redirecting -> /dashboard/admin");
              navigate('/dashboard/admin');
            } else if (roleString.includes('DUENIO') || roleString.includes('DUEÑO')) {
              console.log("Redirecting -> /dashboard/owner");
              navigate('/dashboard/owner');
            } else {
              console.log("Role not matched. Defaulting -> /dashboard/admin");
              navigate('/dashboard/admin'); 
            }
          }, 1000);
        } else {
          throw new Error("No se recibió el token de autenticación.");
        }
      } else {
        // Guardar detalle de error HTTP para debug visible en UI
        setDebugError({
          type: 'HTTP_ERROR',
          status: response.status,
          body: data,
        });
        throw new Error(data.message || data.error || `Error de autenticación (HTTP ${response.status}).`);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Enhanced error handling for network/CORS issues (common in mobile)
      let errorMessage = error.message || "Error desconocido";
      let errorType = 'EXCEPTION';
      
      // Check for specific error types common in mobile
      const errorMsgLower = (error.message || '').toLowerCase();
      if (errorMsgLower.includes('failed to fetch') || 
          errorMsgLower.includes('load failed') ||
          errorMsgLower.includes('networkerror') ||
          errorMsgLower.includes('network request failed') ||
          errorMsgLower.includes('typeerror: failed to fetch')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Error de conexión. Verifica tu conexión a internet y que la API esté disponible.';
        
        // Additional diagnostic info for mobile debugging
        if (!debugError) {
          setDebugError({
            type: errorType,
            message: error.message,
            url: `${API_BASE_URL}/api/auth/login`,
            frontendUrl: window.location.origin,
            protocol: window.location.protocol,
            suggestion: window.location.protocol === 'http:' 
              ? 'El frontend está en HTTP y la API en HTTPS. Esto puede causar problemas de "mixed content" en mobile. Considera usar HTTPS para el frontend o configurar un proxy CORS.'
              : 'Verifica que la API esté accesible desde tu red móvil.'
          });
        }
      } else if (errorMsgLower.includes('cors') || errorMsgLower.includes('cross-origin')) {
        errorType = 'CORS_ERROR';
        errorMessage = 'Error de CORS. El servidor no permite peticiones desde este origen.';
        if (!debugError) {
          setDebugError({
            type: errorType,
            message: error.message,
            url: `${API_BASE_URL}/api/auth/login`,
            frontendUrl: window.location.origin
          });
        }
      } else {
        // Guardar error genérico para debug
        if (!debugError) {
          setDebugError({
            type: errorType,
            message: error.message,
            name: error.name,
            stack: error.stack?.slice(0, 500)
          });
        }
      }
      
      toast({
        title: "Error de acceso",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/login-background.png" 
          alt="Fondo veterinaria" 
          className="w-full h-full object-cover brightness-110"
          onError={(e) => {
            // Fallback si la imagen no se encuentra
            e.target.style.display = 'none';
            e.target.parentElement.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
          }}
        />
        {/* Overlay sutil para mejorar legibilidad del formulario */}
        <div className="absolute inset-0 bg-slate-900/10"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] relative z-10 bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-10 flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
              <PawPrint className="w-12 h-12 text-teal-300 fill-current" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Vet<span className="text-yellow-400">CUE</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Clínica Veterinaria Universitaria
            </p>
          </div>

          {/* Welcome Header */}
          <div className="text-center mb-8 w-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido</h2>
            <p className="text-slate-400 text-sm">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full space-y-5">
            
            {/* Email Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-5 h-5 text-purple-300" />
              </div>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-purple-200 transition-all text-slate-600 placeholder:text-slate-400 rounded-xl shadow-sm"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-5 h-5 text-orange-300" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-orange-200 transition-all text-slate-600 placeholder:text-slate-400 rounded-xl shadow-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="border-slate-300 data-[state=checked]:bg-slate-600 data-[state=checked]:border-slate-600"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500"
                >
                  Recordar sesión
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => toast({ description: "Función de recuperación en desarrollo" })}
                className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-base rounded-xl shadow-lg shadow-yellow-200 hover:shadow-yellow-300 transition-all duration-300 mt-4 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"
                />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>

          </form>
        </div>
      </motion.div>

      {/* Bloque de diagnóstico visible también en mobile */}
      {debugError && (
        <div className="fixed bottom-2 left-2 right-2 max-w-xl mx-auto z-20">
          <div className="text-xs bg-black/80 text-amber-200 px-3 py-2 rounded-lg border border-amber-500 space-y-1">
            <div className="font-semibold">DEBUG LOGIN (solo temporal)</div>
            <div>Tipo: {debugError.type}</div>
            {'status' in debugError && (
              <div>Status HTTP: {debugError.status}</div>
            )}
            {debugError.message && (
              <div>Mensaje: {debugError.message}</div>
            )}
            {debugError.body && (
              <div className="max-h-24 overflow-y-auto break-all">
                Cuerpo: {typeof debugError.body === 'string' ? debugError.body : JSON.stringify(debugError.body)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
