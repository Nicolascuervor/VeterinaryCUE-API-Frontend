#!/bin/bash

echo "=========================================="
echo "Diagnóstico de Bad Gateway (502)"
echo "=========================================="
echo ""

# 1. Verificar contenedor
echo "1. Verificando contenedor del frontend..."
if docker ps | grep -q veterinary-frontend; then
    echo "   ✅ Contenedor está corriendo"
    docker ps | grep veterinary-frontend
else
    echo "   ❌ Contenedor NO está corriendo"
    echo "   Intentando iniciar..."
    docker compose up -d
fi
echo ""

# 2. Verificar puerto
echo "2. Verificando puerto 90..."
if netstat -tuln 2>/dev/null | grep -q ":90 " || ss -tuln 2>/dev/null | grep -q ":90 "; then
    echo "   ✅ Puerto 90 está escuchando"
else
    echo "   ❌ Puerto 90 NO está escuchando"
fi
echo ""

# 3. Verificar logs
echo "3. Últimas 20 líneas de logs del contenedor:"
echo "   ----------------------------------------"
docker logs --tail 20 veterinary-frontend 2>&1 | head -20
echo ""

# 4. Verificar conectividad local
echo "4. Probando conectividad local en puerto 90..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:90 | grep -q "200\|301\|302"; then
    echo "   ✅ El contenedor responde correctamente en localhost:90"
else
    echo "   ❌ El contenedor NO responde en localhost:90"
    echo "   Código HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:90)"
fi
echo ""

# 5. Verificar red
echo "5. Verificando configuración de red..."
docker inspect veterinary-frontend 2>/dev/null | grep -A 10 "Networks" || echo "   ⚠️  No se pudo obtener información de red"
echo ""

# 6. Verificar DNS
echo "6. Verificando DNS de veterinariacue.com..."
if command -v dig &> /dev/null; then
    DNS_IP=$(dig +short veterinariacue.com | head -1)
    echo "   IP del DNS: $DNS_IP"
    if [ "$DNS_IP" == "145.223.74.36" ]; then
        echo "   ✅ DNS apunta correctamente a 145.223.74.36"
    else
        echo "   ⚠️  DNS apunta a $DNS_IP (esperado: 145.223.74.36)"
    fi
elif command -v nslookup &> /dev/null; then
    DNS_IP=$(nslookup veterinariacue.com | grep -A 1 "Name:" | tail -1 | awk '{print $2}')
    echo "   IP del DNS: $DNS_IP"
else
    echo "   ⚠️  No se encontraron herramientas de DNS (dig/nslookup)"
fi
echo ""

# 7. Verificar firewall
echo "7. Verificando firewall (iptables)..."
if command -v iptables &> /dev/null; then
    if iptables -L -n | grep -q "90"; then
        echo "   ⚠️  Hay reglas de firewall para el puerto 90"
        iptables -L -n | grep "90"
    else
        echo "   ℹ️  No se encontraron reglas específicas para el puerto 90"
    fi
else
    echo "   ⚠️  iptables no está disponible"
fi
echo ""

# 8. Resumen
echo "=========================================="
echo "Resumen"
echo "=========================================="
echo "Si el contenedor está corriendo y responde en localhost:90,"
echo "pero aún recibes Bad Gateway, el problema está en la"
echo "configuración del proxy reverso de Dokploy."
echo ""
echo "Verifica en Dokploy:"
echo "  - Path: /"
echo "  - Port: 90"
echo "  - Target: localhost:90 o 127.0.0.1:90"
echo "  - Protocol: http (Dokploy manejará HTTPS)"
echo ""

