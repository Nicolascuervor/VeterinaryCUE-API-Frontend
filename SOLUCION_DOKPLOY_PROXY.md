# Solución: Bad Gateway - Configuración de Dokploy

## ✅ Diagnóstico Confirmado

El contenedor está funcionando perfectamente:
- ✅ Contenedor corriendo
- ✅ Puerto 90 respondiendo
- ✅ Nginx sin errores
- ✅ Aplicación sirviendo HTML correctamente

**El problema está en la configuración del proxy reverso de Dokploy.**

## 🔧 Soluciones para Dokploy

### Opción 1: Verificar configuración del dominio en Dokploy

En el panel de Dokploy, ve a la aplicación y verifica:

1. **Pestaña "Domains"**
2. **Configuración del dominio `veterinariacue.com`:**
   - **Path:** `/`
   - **Port:** `90` ✅ (correcto)
   - **Protocol:** `http` (Dokploy maneja HTTPS)
   - **Target/Upstream:** Debe ser uno de estos:
     - `localhost:90`
     - `127.0.0.1:90`
     - `172.18.0.1:90` (IP del host Docker)
     - O simplemente `90` si Dokploy lo permite

### Opción 2: Usar la IP del host Docker

Si Dokploy no puede conectarse a `localhost:90`, prueba con la IP del host Docker:

```bash
# En el servidor, obtener la IP del host Docker
docker network inspect bridge | grep Gateway
# O
ip addr show docker0 | grep inet
```

Luego en Dokploy, usa esa IP en lugar de `localhost`.

### Opción 3: Configuración avanzada del proxy en Dokploy

Si Dokploy permite configuración avanzada de Nginx, agrega:

```nginx
location / {
    proxy_pass http://127.0.0.1:90;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

### Opción 4: Verificar red de Dokploy

Dokploy puede estar usando una red Docker diferente. Verifica:

```bash
# Ver todas las redes
docker network ls

# Ver en qué red está el contenedor
docker inspect veterinary-frontend | grep -A 10 Networks

# Ver en qué red está Dokploy (si puedes identificar el contenedor)
docker ps | grep dokploy
docker inspect <dokploy-container> | grep -A 10 Networks
```

Si están en redes diferentes, necesitas:
1. Conectar el contenedor a la red de Dokploy, O
2. Usar la IP del host en lugar de localhost

### Opción 5: Exponer el contenedor en la red de Dokploy

Si Dokploy crea su propia red, conecta el contenedor a esa red:

```bash
# 1. Identificar la red de Dokploy
docker network ls | grep dokploy

# 2. Conectar el contenedor a esa red (sin desconectarlo de la actual)
docker network connect <nombre-red-dokploy> veterinary-frontend

# 3. Verificar
docker inspect veterinary-frontend | grep -A 10 Networks
```

Luego en Dokploy, usa el nombre del contenedor como host:
- Target: `veterinarian-frontend:80` (puerto interno del contenedor)
- O si Dokploy resuelve nombres: `veterinarian-frontend`

## 🎯 Pasos Recomendados (en orden)

### Paso 1: Verificar configuración básica en Dokploy

1. Ve a la aplicación en Dokploy
2. Pestaña "Domains"
3. Edita el dominio `veterinariacue.com`
4. Verifica:
   - Path: `/`
   - Port: `90`
   - Target: `127.0.0.1:90` o `localhost:90`

### Paso 2: Probar con IP del host

Si `localhost` no funciona, prueba con la IP del host Docker:

```bash
# Obtener IP del host Docker
docker network inspect bridge | grep Gateway
```

Luego en Dokploy, usa esa IP en el Target.

### Paso 3: Verificar logs de Dokploy

En Dokploy, ve a:
- Pestaña "Deployments" o "Logs"
- Busca errores relacionados con:
  - `connection refused`
  - `timeout`
  - `upstream failed`

### Paso 4: Probar conectividad desde Dokploy

Si Dokploy tiene una terminal o shell, prueba:

```bash
# Desde dentro del contenedor/servicio de Dokploy
curl http://127.0.0.1:90
# O
curl http://localhost:90
```

Si esto no funciona, el problema es de red.

## 🔍 Información Adicional para Dokploy

Si Dokploy tiene opciones avanzadas, verifica:

1. **Network Mode:**
   - Debe ser `host` o `bridge`
   - NO debe ser una red aislada

2. **Proxy Settings:**
   - `proxy_pass` debe apuntar a `http://127.0.0.1:90`
   - Headers de proxy deben estar configurados

3. **Health Check:**
   - Dokploy puede tener un health check configurado
   - Debe apuntar a `http://127.0.0.1:90/health` (agregamos este endpoint)

## 📝 Comandos Útiles para Diagnóstico

```bash
# Verificar que el puerto esté escuchando
netstat -tuln | grep 90
# O
ss -tuln | grep 90

# Verificar desde dónde se puede acceder
curl -v http://127.0.0.1:90
curl -v http://localhost:90
curl -v http://172.18.0.1:90  # IP del host Docker

# Ver logs de Nginx en tiempo real
docker logs -f veterinary-frontend

# Verificar red del contenedor
docker inspect veterinary-frontend | grep -A 20 Networks

# Probar health check
curl http://localhost:90/health
```

## ⚠️ Problema Común: Dokploy en contenedor separado

Si Dokploy está corriendo en un contenedor Docker separado, `localhost` desde Dokploy NO apunta al mismo lugar que `localhost` desde el host.

**Solución:**
1. Usar la IP del host: `172.18.0.1:90` o la IP de la interfaz Docker
2. O conectar ambos contenedores a la misma red Docker
3. O usar `host.docker.internal:90` si Dokploy lo soporta

## 🎯 Próximos Pasos

1. ✅ Verifica la configuración del dominio en Dokploy (Target/Upstream)
2. ✅ Prueba cambiar `localhost` por `127.0.0.1` o la IP del host Docker
3. ✅ Revisa los logs de Dokploy para ver el error específico
4. ✅ Si Dokploy está en un contenedor, conecta ambos a la misma red

