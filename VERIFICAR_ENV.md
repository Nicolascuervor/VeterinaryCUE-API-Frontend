# Verificación de Variables de Entorno

## Problema: VITE_STRIPE_PUBLISHABLE_KEY está undefined

### Pasos para solucionar:

1. **Verificar que el archivo `.env` existe en la raíz del proyecto**
   ```bash
   # Debe estar en: C:\Users\asus\HorizonFront\.env
   # Mismo nivel que package.json
   ```

2. **Verificar el contenido del archivo `.env`**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SURSFIAMGXBUg6QlIYn7aX4F5xr2rsyMnR3CG5zg1IXm70nXQkwz0wbe578kqiLNLVmRM6BT5vQjhcgAUZ7IbxY00uL710Mis
   ```
   
   **IMPORTANTE:**
   - No debe tener espacios alrededor del `=`
   - No debe tener comillas
   - Debe empezar con `VITE_`
   - No debe tener líneas en blanco antes de la variable

3. **REINICIAR el servidor de desarrollo**
   
   Vite solo carga las variables de entorno cuando inicia. Debes:
   
   ```bash
   # 1. Detener el servidor (Ctrl+C)
   # 2. Iniciar nuevamente
   npm run dev
   ```

4. **Verificar en la consola del navegador**
   
   Después de reiniciar, abre la consola (F12) y busca:
   - ✅ `Stripe key configurada correctamente` = Funciona
   - ❌ `VITE_STRIPE_PUBLISHABLE_KEY no está configurada` = Revisa los pasos anteriores

5. **Si sigue sin funcionar:**
   
   - Verifica que no haya un archivo `.env.local` o `.env.production` que esté sobrescribiendo
   - Limpia la caché de Vite: `rm -rf node_modules/.vite` (o en Windows: `Remove-Item -Recurse -Force node_modules\.vite`)
   - Verifica que el archivo `.env` no esté en `.gitignore` de forma incorrecta

## Para Producción (Dokploy)

En Dokploy, asegúrate de que la variable de entorno esté configurada en:
- **Nombre:** `VITE_STRIPE_PUBLISHABLE_KEY`
- **Valor:** `pk_test_51SURSFIAMGXBUg6Q1IYn7aX4F5xr2rsyMnR3CG5zg1IXm70nXQkwz0Wbe578kqiLNLVmRM6BT5vQjhcgAUZ7IbxY00uL710Mis`

Después de configurarla, **redespliega la aplicación** para que tome efecto.

