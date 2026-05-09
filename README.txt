# Juego matemático automático con validación inmediata

## Cambios realizados
- Ahora marca error en el momento si el número se coloca en una casilla incorrecta.
- El número incorrecto no queda colocado.
- Se agregó modo "Automático": arma un crucigrama nuevo cada vez.
- Se mantiene modo "Plantilla fija".
- Los números se pueden arrastrar o tocar/clickear.
- Botón "Nuevo" para generar otro crucigrama automático.

## Archivos
- index.html
- style.css
- app.js
- levels.js

## Subir a Hetzner
Subir todos los archivos a la carpeta del sitio, por ejemplo:
`/var/www/juego-matematico`

Nginx básico:

server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/juego-matematico;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
