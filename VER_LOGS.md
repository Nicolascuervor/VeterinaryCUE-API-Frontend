# Guía para Ver Logs de la Aplicación Desplegada

## 🐳 Si estás usando Docker / Docker Compose

### 1. Ver todos los logs de todos los servicios

```bash
docker-compose logs
```

### 2. Ver logs de un servicio específico

**Logs del servicio de citas (donde se envían las notificaciones):**
```bash
docker-compose logs citas-service
```

**Logs del servicio de notificaciones (donde se procesan y envían los correos):**
```bash
docker-compose logs notification-service
```

**Logs del servicio de autenticación:**
```bash
docker-compose logs authentication-service
```

### 3. Ver logs en tiempo real (seguimiento continuo)

```bash
# Todos los servicios
docker-compose logs -f

# Solo citas-service
docker-compose logs -f citas-service

# Solo notification-service
docker-compose logs -f notification-service

# Múltiples servicios a la vez
docker-compose logs -f citas-service notification-service
```

### 4. Ver últimas líneas de logs

```bash
# Últimas 100 líneas del citas-service
docker-compose logs --tail=100 citas-service

# Últimas 50 líneas del notification-service
docker-compose logs --tail=50 notification-service
```

### 5. Filtrar logs por palabras clave

```bash
# Buscar logs que contengan "notificación" o "notification"
docker-compose logs citas-service | grep -i "notificación\|notification"

# Buscar logs de errores
docker-compose logs citas-service | grep -i "error\|exception"

# Buscar logs de envío de correos
docker-compose logs notification-service | grep -i "correo\|email\|enviando"

# Buscar logs de Kafka
docker-compose logs citas-service notification-service | grep -i "kafka"
```

### 6. Ver logs desde una fecha/hora específica

```bash
# Ver logs desde hace 10 minutos
docker-compose logs --since 10m citas-service

# Ver logs desde hace 1 hora
docker-compose logs --since 1h citas-service

# Ver logs desde una fecha específica
docker-compose logs --since 2025-12-02T10:00:00 citas-service
```

### 7. Ver logs usando nombres de contenedores directamente

Si conoces el nombre del contenedor:

```bash
# Listar contenedores activos
docker ps

# Ver logs de un contenedor específico
docker logs citas-service-container-name
docker logs notification-service-container-name

# Ver logs en tiempo real
docker logs -f citas-service-container-name

# Ver últimas 100 líneas
docker logs --tail=100 citas-service-container-name
```

## 📋 Comandos Útiles para Diagnosticar Problemas de Correos

### Ver logs completos del flujo de notificaciones:

```bash
# 1. Ver logs del citas-service (donde se crea la cita y se envía a Kafka)
docker-compose logs --tail=200 citas-service | grep -i "notificación\|notification\|kafka\|cita.*creada\|enviando"

# 2. Ver logs del notification-service (donde se recibe y procesa)
docker-compose logs --tail=200 notification-service | grep -i "evento\|notification\|correo\|email\|enviando\|kafka"

# 3. Ver todos los logs relacionados con una cita específica (reemplaza 123 con el ID de la cita)
docker-compose logs citas-service | grep "Cita ID: 123"
docker-compose logs notification-service | grep "Cita ID: 123"
```

### Ver logs en tiempo real mientras creas una cita:

```bash
# Terminal 1: Monitorear citas-service
docker-compose logs -f citas-service

# Terminal 2: Monitorear notification-service
docker-compose logs -f notification-service

# Luego crea una cita desde el frontend y observa los logs
```

## 🔍 Qué buscar en los logs

### En `citas-service`, deberías ver:

```
=== INICIANDO ENVÍO DE NOTIFICACIONES ===
Cita ID: X, Usuario ID: Y, Veterinario ID: Z, Pet ID: W
Obteniendo datos del dueño (Usuario ID: Y)...
Dueño obtenido: Nombre Apellido (correo@ejemplo.com)
Obteniendo datos del veterinario (Veterinario ID: Z)...
Veterinario obtenido: Nombre Apellido (correo@ejemplo.com)
Obteniendo datos de la mascota (Pet ID: W)...
Mascota obtenida: NombreMascota
Enviando notificación al dueño: correo@ejemplo.com
✅ Solicitud de notificación enviada al dueño para Cita ID: X
Enviando notificación al veterinario: correo@ejemplo.com
✅ Solicitud de notificación enviada al veterinario para Cita ID: X
=== FINALIZANDO ENVÍO DE NOTIFICACIONES ===
```

### En `notification-service`, deberías ver:

```
Evento de notificación recibido para tipo: CITA_CONFIRMACION
Ejecutando Estrategia CITA_CONFIRMACION...
Enviando confirmación de cita a correo@ejemplo.com
Correo de cita enviado.
```

## 🚨 Si no ves logs o están vacíos

1. **Verificar que los servicios estén corriendo:**
   ```bash
   docker-compose ps
   # O
   docker ps
   ```

2. **Verificar que los servicios tengan logs:**
   ```bash
   docker-compose logs citas-service | head -20
   ```

3. **Reiniciar los servicios si es necesario:**
   ```bash
   docker-compose restart citas-service notification-service
   ```

## ☁️ Si estás usando otras plataformas

### Kubernetes:
```bash
# Ver logs de un pod
kubectl logs <pod-name> -n <namespace>

# Ver logs en tiempo real
kubectl logs -f <pod-name> -n <namespace>

# Ver logs de múltiples pods
kubectl logs -f -l app=citas-service -n <namespace>
```

### AWS ECS:
```bash
# Ver logs usando AWS CLI
aws logs tail /ecs/citas-service --follow

# O desde la consola de AWS CloudWatch
```

### Heroku:
```bash
# Ver logs en tiempo real
heroku logs --tail --app tu-app-name

# Ver logs de un dyno específico
heroku logs --tail --dyno web.1 --app tu-app-name
```

## 💡 Tip: Guardar logs en un archivo

```bash
# Guardar logs en un archivo
docker-compose logs citas-service > citas-service-logs.txt
docker-compose logs notification-service > notification-service-logs.txt

# Guardar logs con timestamp
docker-compose logs --since 1h citas-service > citas-service-$(date +%Y%m%d-%H%M%S).txt
```

