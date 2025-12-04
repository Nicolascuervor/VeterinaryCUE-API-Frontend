# Solución para Error "Bad Gateway" (502) en Dokploy

## Diagnóstico del Problema

El error "Bad Gateway" ocurre cuando Dokploy (que actúa como proxy reverso) no puede conectarse al contenedor del frontend. Esto puede deberse a:

1. **Problema de red**: El contenedor no está en la red correcta que Dokploy puede alcanzar
2. **Contenedor no está corriendo**: El servicio no está activo
3. **Puerto incorrecto**: El puerto configurado en Dokploy no coincide con el del contenedor
4. **Configuración de red externa**: La red `dokploy-network` puede no existir o no ser accesible

## Soluciones

### Opción 1: Verificar que el contenedor esté corriendo

```bash
# Conectarse al servidor VPS
ssh root@145.223.74.36

# Verificar contenedores activos
docker ps -a | grep frontend

# Ver logs del contenedor
docker logs veterinary-frontend

# Si no está corriendo, iniciarlo
cd /ruta/al/proyecto
docker compose up -d
```

### Opción 2: Verificar la red Docker

```bash
# Verificar si la red existe
docker network ls | grep dokploy

# Si no existe, crearla
docker network create dokploy-network

# Verificar que el contenedor esté en la red
docker inspect veterinary-frontend | grep -A 10 Networks
```

### Opción 3: Usar la red por defecto de Dokploy

Si Dokploy crea su propia red, necesitas que el contenedor esté en esa red. Modifica `docker-compose.yml`:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    image: veterinary-frontend:latest
    container_name: veterinary-frontend
    restart: always
    ports:
      - "90:80"
    # Remover la red externa y dejar que Dokploy la gestione
    # O usar la red específica de Dokploy si la conoces
    networks:
      - default

networks:
  default:
    name: dokploy-network
    external: true
```

### Opción 4: Configuración en Dokploy

En el panel de Dokploy, verifica:

1. **Dominio configurado correctamente**:
   - Path: `/`
   - Port: `90` (debe coincidir con el puerto mapeado en docker-compose)
   - HTTPS: Habilitado
   - Certificado: Let's Encrypt configurado

2. **Verificar que el servicio esté corriendo**:
   - Ve a la sección "Deployments" en Dokploy
   - Verifica que el estado sea "Running"
   - Revisa los logs si hay errores

3. **Configuración de red en Dokploy**:
   - Si Dokploy tiene una opción de "Network" o "Docker Network", asegúrate de que coincida con la red del contenedor

### Opción 5: Probar conectividad directa

```bash
# Desde el servidor, probar si el puerto 90 responde
curl http://localhost:90

# O desde fuera del servidor (si el firewall lo permite)
curl http://145.223.74.36:90
```

Si esto funciona pero el dominio no, el problema está en la configuración del proxy de Dokploy.

### Opción 6: Verificar logs de Dokploy

En el panel de Dokploy:
1. Ve a la sección de logs de la aplicación
2. Busca errores relacionados con:
   - Conexión rechazada
   - Timeout
   - Network unreachable

## Configuración Recomendada

Para Dokploy, la configuración más común es:

1. **docker-compose.yml** (sin red externa específica):
```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    image: veterinary-frontend:latest
    container_name: veterinary-frontend
    restart: always
    ports:
      - "90:80"
    # Dejar que Dokploy gestione la red
```

2. **En Dokploy**:
   - Path: `/`
   - Port: `90`
   - Protocol: `http` (Dokploy manejará HTTPS)
   - Target: `localhost:90` o `127.0.0.1:90`

## Pasos de Verificación

1. ✅ Contenedor corriendo: `docker ps | grep frontend`
2. ✅ Puerto escuchando: `netstat -tuln | grep 90` o `ss -tuln | grep 90`
3. ✅ Red correcta: `docker inspect veterinary-frontend`
4. ✅ Logs sin errores: `docker logs veterinary-frontend`
5. ✅ DNS apuntando correctamente: `dig veterinariacue.com` o `nslookup veterinariacue.com`
6. ✅ Certificado SSL válido en Dokploy

## Comandos Útiles

```bash
# Reiniciar el contenedor
docker restart veterinary-frontend

# Reconstruir y levantar
docker compose down
docker compose up -d --build

# Ver logs en tiempo real
docker logs -f veterinary-frontend

# Verificar puertos
docker port veterinary-frontend

# Verificar red
docker network inspect dokploy-network
```

