# HorizonFront - Docker

## Requisitos

- Docker 24+
- Docker Compose V2

## Variables útiles

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `VITE_API_BASE_URL` | URL del backend usada durante el `npm run build`. | `https://api.veterinariacue.com` |
| `FRONTEND_PORT` | Puerto expuesto en tu máquina. | `3000` |

## Construir y ejecutar con Docker

```bash
# 1. Construir imagen y levantar el contenedor
docker compose -f docker-compose.frontend.yml up -d --build

# 2. Ver logs
docker logs -f vetcue-frontend

# 3. Detener
docker compose -f docker-compose.frontend.yml down
```

Una vez levantado, la aplicación estará disponible en `http://localhost:${FRONTEND_PORT}`.

## Personalizar la URL del backend

```bash
VITE_API_BASE_URL=http://api-gateway:8070 docker compose -f docker-compose.frontend.yml up -d --build
```

> **Nota:** para entornos orquestados, puedes reutilizar esta imagen apuntando la variable `VITE_API_BASE_URL` al gateway (por ejemplo, `http://api-gateway:8070` cuando compartas red con los microservicios).

