# 🔧 Guía de Solución: Error Bad Gateway (502) en Dokploy

## 📋 Problema
Al acceder a `https://veterinariacue.com/` recibes un error **"Bad Gateway" (502)**, lo que significa que Dokploy (proxy reverso) no puede conectarse al contenedor del frontend.

## 🔍 Diagnóstico Rápido

### Paso 1: Verificar que el contenedor esté corriendo

Conéctate al servidor VPS:
```bash
ssh root@145.223.74.36
```

Verifica el estado del contenedor:
```bash
docker ps | grep frontend
```

**Si NO está corriendo:**
```bash
cd /ruta/donde/esta/tu/proyecto
docker compose up -d
```

### Paso 2: Verificar que el puerto 90 responda

```bash
# Probar desde el servidor
curl http://localhost:90

# Deberías ver el HTML de la aplicación o al menos una respuesta HTTP 200
```

**Si no responde:**
- Verifica los logs: `docker logs veterinary-frontend`
- Verifica el puerto: `docker port veterinary-frontend`

### Paso 3: Verificar configuración en Dokploy

En el panel de Dokploy, verifica la configuración del dominio:

1. **Ve a la aplicación "API-FRONTEND"**
2. **Pestaña "Domains"**
3. **Verifica:**
   - ✅ **Path:** `/`
   - ✅ **Port:** `90` (debe coincidir con el puerto mapeado en docker-compose)
   - ✅ **Protocol:** `http` (Dokploy manejará HTTPS automáticamente)
   - ✅ **Target/Upstream:** `localhost:90` o `127.0.0.1:90`

## 🛠️ Soluciones

### Solución 1: Simplificar docker-compose.yml (Recomendada)

He actualizado tu `docker-compose.yml` para que sea más compatible con Dokploy. La red externa puede causar problemas.

**Cambios realizados:**
- Removida la dependencia de red externa `dokploy-network`
- Agregado el argumento `VITE_API_BASE_URL` para el build
- Simplificada la configuración

**Aplicar los cambios:**
```bash
# 1. Detener el contenedor actual
docker compose down

# 2. Reconstruir con la nueva configuración
docker compose up -d --build

# 3. Verificar que esté corriendo
docker ps | grep frontend

# 4. Probar localmente
curl http://localhost:90
```

### Solución 2: Verificar red en Dokploy

Si Dokploy requiere una red específica:

1. **En Dokploy, ve a la configuración de la aplicación**
2. **Busca la sección "Network" o "Docker Network"**
3. **Anota el nombre de la red que Dokploy usa**
4. **Actualiza docker-compose.yml:**

```yaml
networks:
  default:
    name: nombre-de-la-red-de-dokploy
    external: true
```

### Solución 3: Usar script de diagnóstico

He creado un script de diagnóstico. Úsalo así:

```bash
# Dar permisos de ejecución
chmod +x diagnostico-bad-gateway.sh

# Ejecutar
./diagnostico-bad-gateway.sh
```

Este script verificará:
- ✅ Estado del contenedor
- ✅ Puerto 90
- ✅ Logs del contenedor
- ✅ Conectividad local
- ✅ Configuración de red
- ✅ DNS
- ✅ Firewall

### Solución 4: Verificar logs de Dokploy

En el panel de Dokploy:

1. **Ve a la aplicación "API-FRONTEND"**
2. **Pestaña "Deployments" o "Logs"**
3. **Busca errores como:**
   - `connection refused`
   - `timeout`
   - `network unreachable`
   - `upstream failed`

### Solución 5: Configuración manual del proxy en Dokploy

Si Dokploy permite configuración avanzada del proxy:

1. **En la configuración del dominio, busca "Advanced" o "Custom Config"**
2. **Asegúrate de que el upstream apunte a:**
   ```
   upstream frontend {
       server localhost:90;
   }
   ```
3. **O si Dokploy usa variables:**
   ```
   proxy_pass http://127.0.0.1:90;
   ```

## ✅ Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Contenedor está corriendo: `docker ps | grep frontend`
- [ ] Puerto 90 responde: `curl http://localhost:90`
- [ ] No hay errores en logs: `docker logs veterinary-frontend`
- [ ] DNS apunta correctamente: `dig veterinariacue.com` → debe ser `145.223.74.36`
- [ ] Certificado SSL válido en Dokploy (debería estar en verde "DNS Valid")
- [ ] Configuración en Dokploy:
  - [ ] Path: `/`
  - [ ] Port: `90`
  - [ ] Protocol: `http`
  - [ ] Target: `localhost:90` o `127.0.0.1:90`

## 🚨 Problemas Comunes

### Problema: "Connection refused"
**Causa:** El contenedor no está corriendo o el puerto no está mapeado correctamente.
**Solución:** 
```bash
docker compose up -d
docker ps | grep frontend  # Verificar
```

### Problema: "Timeout"
**Causa:** El contenedor está corriendo pero no responde.
**Solución:**
```bash
docker logs veterinary-frontend  # Ver errores
docker restart veterinary-frontend
```

### Problema: "Network unreachable"
**Causa:** Problema de red Docker.
**Solución:**
```bash
# Verificar red
docker network ls
docker inspect veterinary-frontend | grep Network

# Si es necesario, recrear
docker compose down
docker compose up -d
```

## 📞 Información para Soporte

Si el problema persiste, recopila esta información:

```bash
# 1. Estado del contenedor
docker ps -a | grep frontend

# 2. Logs del contenedor (últimas 50 líneas)
docker logs --tail 50 veterinary-frontend

# 3. Verificar puerto
netstat -tuln | grep 90
# o
ss -tuln | grep 90

# 4. Probar conectividad
curl -v http://localhost:90

# 5. Información de red
docker inspect veterinary-frontend | grep -A 20 Networks

# 6. Versión de Docker
docker --version
docker compose version
```

## 📝 Notas Importantes

1. **Dokploy maneja HTTPS automáticamente**: No necesitas configurar SSL en el contenedor, solo HTTP en el puerto 90.

2. **El puerto 90 debe estar expuesto**: En `docker-compose.yml` debe estar `"90:80"` (puerto del host:puerto del contenedor).

3. **El contenedor debe estar accesible desde localhost**: Dokploy se conecta a `localhost:90` o `127.0.0.1:90`.

4. **La red externa puede causar problemas**: Si no es necesaria, es mejor no usarla.

## 🎯 Próximos Pasos

1. ✅ Aplica los cambios en `docker-compose.yml`
2. ✅ Reconstruye y reinicia el contenedor
3. ✅ Ejecuta el script de diagnóstico
4. ✅ Verifica la configuración en Dokploy
5. ✅ Prueba acceder a `https://veterinariacue.com/`

Si después de estos pasos aún tienes el problema, comparte los resultados del script de diagnóstico y los logs de Dokploy.

