# 📱 Instalar Dominó en Android

## Método Rápido (GitHub Pages)

### Paso 1: Ejecutar deploy
```bash
cd /home/user/domino-basico
./deploy.sh
```

### Paso 2: Configurar GitHub Pages
1. Ve a: https://github.com/korpos94-cloud/domino-basico/settings/pages
2. En **"Source"**, selecciona la rama: `claude/domino-game-complete-Y3RZn`
3. Click en **"Save"**
4. Espera 2-3 minutos para que se publique

### Paso 3: Instalar en Android
1. **En tu móvil Android**, abre **Chrome**
2. Ve a: `https://korpos94-cloud.github.io/domino-basico/`
3. Verás un banner o botón **"Instalar app"** / **"Agregar a inicio"**
4. Toca **"Instalar"**
5. ¡Listo! El juego aparecerá en tu pantalla de inicio como una app

---

## Alternativa: Servidor Local WiFi

Si no quieres publicar en internet:

### En tu PC:
```bash
cd /home/user/domino-basico
python3 -m http.server 8000

# Encuentra tu IP:
ip addr show | grep "inet " | grep -v 127.0.0.1
# Ejemplo de salida: 192.168.1.105
```

### En tu Android:
1. Conéctate a la **misma WiFi** que tu PC
2. Abre **Chrome**
3. Ve a: `http://TU_IP:8000` (ej: `http://192.168.1.105:8000`)
4. El juego se cargará y podrás jugar
5. Para instalarlo: Menú (⋮) → **"Instalar aplicación"**

---

## ¿Qué obtienes al instalar?

✅ **Ícono en pantalla de inicio** (como app nativa)
✅ **Funciona sin internet** (offline completo)
✅ **Sin barra de navegador** (pantalla completa)
✅ **Rápido y fluido** (cacheo inteligente)
✅ **Notificaciones** (si activas)
✅ **Actualizaciones automáticas**

---

## Servicios de Hosting Gratuitos Alternativos

### Netlify (Super Fácil)
1. Ve a: https://app.netlify.com/drop
2. Arrastra la carpeta `domino-basico`
3. ¡Listo! Te da una URL al instante

### Vercel
1. Ve a: https://vercel.com/new
2. Importa tu repo de GitHub
3. Deploy automático en 30 segundos

### Cloudflare Pages
1. Ve a: https://pages.cloudflare.com/
2. Conecta tu GitHub
3. Selecciona el repo y despliega

Todas estas opciones son **100% GRATIS** y te dan HTTPS automático para que la PWA funcione perfectamente.

---

## Solución de Problemas

**No veo el botón "Instalar":**
- Asegúrate de estar usando **Chrome** (no Firefox ni otros)
- Verifica que la página se cargue con **HTTPS** (candado verde)
- Refresca la página (F5)

**No funciona offline:**
- Verifica que el archivo `service-worker.js` esté en la raíz
- Abre DevTools (F12) → Application → Service Workers
- Debe aparecer "Activated and running"

**El juego va lento:**
- En Android: Settings → Apps → Chrome → Storage → Clear cache
- Reinstala la PWA

---

¡Disfruta jugando al dominó desde tu Android! 🎲📱
