# Juego matemático corregido

## Correcciones
- El generador automático ya no arma columnas sueltas con cálculos incorrectos.
- Las filas y columnas se generan como operaciones completas: A operador B = Resultado.
- Se eliminan números extra: ahora hay la misma cantidad de números disponibles que casillas a completar.
- Los números disponibles son más chicos para que entren mejor en pantalla.
- Arrastre mejorado en celular con pointer/touch.
- Validación inmediata: si el número va en lugar incorrecto, marca error y no lo deja colocado.

## Subir a Hetzner
Subir estos archivos:
- index.html
- style.css
- app.js
- levels.js

A la carpeta pública, por ejemplo:
`/var/www/juego-matematico`

Nginx:
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/juego-matematico;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}


## Corrección adicional
- Se corrigió la traba al arrastrar en celular.
- Ahora el número solo entra en modo arrastre si realmente se mueve.
- Se limpian correctamente los eventos táctiles al soltar o cancelar.
