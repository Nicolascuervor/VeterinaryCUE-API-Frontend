# Diagnóstico de Correos Electrónicos

## 🔍 Problema
Las citas se crean correctamente y se persisten en la base de datos, pero no se envían correos electrónicos de confirmación.

## ✅ Flujo Correcto del Sistema

1. **Frontend** → Crea cita → `POST /api/citas`
2. **Citas-Service** → Crea la cita en BD
3. **Citas-Service** → Llama a `enviarNotificacionConfirmacion()`
4. **Citas-Service** → Envía mensaje a Kafka topic: `usuarios_registrados_topic`
5. **Notification-Service** → Escucha el topic y procesa la notificación
6. **Notification-Service** → Usa `CitaEmailNotificationStrategy` para enviar el correo
7. **EmailService** → Envía el correo vía SMTP

## 🔧 Verificaciones Necesarias

### 1. Verificar que Kafka esté corriendo
```bash
docker ps | grep kafka
# O
docker-compose ps | grep kafka
```

Si no está corriendo:
```bash
docker-compose up -d kafka
# O según tu configuración
```

### 2. Verificar que el Notification-Service esté activo
```bash
docker ps | grep notification
# O revisar los logs
docker logs notification-service
```

### 3. Verificar logs del Citas-Service
Buscar en los logs si se está enviando el mensaje a Kafka:
```bash
docker logs citas-service | grep "Solicitud de notificación enviada"
```

Deberías ver algo como:
```
Solicitud de notificación enviada para Cita ID: 33
```

### 4. Verificar logs del Notification-Service
Buscar si está recibiendo y procesando los mensajes:
```bash
docker logs notification-service | grep "Evento de notificación recibido"
docker logs notification-service | grep "CITA_CONFIRMACION"
```

### 5. Verificar configuración SMTP
Revisar el archivo `application.properties` del notification-service:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tu-email@gmail.com
spring.mail.password=tu-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 6. Verificar que el topic de Kafka exista
```bash
docker exec -it kafka-container kafka-topics --list --bootstrap-server localhost:9092
```

Deberías ver `usuarios_registrados_topic` en la lista.

### 7. Verificar mensajes en el topic
```bash
docker exec -it kafka-container kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic usuarios_registrados_topic \
  --from-beginning
```

## 🐛 Problemas Comunes

### Problema 1: Kafka no está corriendo
**Solución**: Iniciar Kafka con Docker Compose

### Problema 2: Notification-Service no está escuchando
**Solución**: Verificar que el servicio esté activo y revisar logs para errores

### Problema 3: Credenciales SMTP incorrectas
**Solución**: Verificar y actualizar las credenciales en `application.properties`

### Problema 4: Correos en carpeta de spam
**Solución**: Revisar la carpeta de spam del destinatario

### Problema 5: El nombre de la mascota no se obtiene correctamente
**Problema en código**: En `CitaServiceImpl.java` línea 241, se usa `"Mascota ID: " + cita.getPetId()` en lugar de `mascota.getNombre()`

**Solución**: Corregir en el backend:
```java
if (mascota != null && mascota.getNombre() != null) {
    nombreMascota = mascota.getNombre(); // Cambiar esta línea
}
```

## 📝 Logs a Revisar

1. **Citas-Service**: Buscar "Solicitud de notificación enviada"
2. **Notification-Service**: Buscar "Evento de notificación recibido"
3. **Notification-Service**: Buscar "Ejecutando Estrategia CITA_CONFIRMACION"
4. **Notification-Service**: Buscar "Enviando confirmación de cita"
5. **Notification-Service**: Buscar errores relacionados con SMTP

## 🔄 Prueba Manual

1. Crear una cita desde el frontend
2. Verificar en logs del citas-service que se envió el mensaje a Kafka
3. Verificar en logs del notification-service que recibió el mensaje
4. Verificar en logs del notification-service que intentó enviar el correo
5. Revisar la bandeja de entrada (y spam) del correo del dueño

