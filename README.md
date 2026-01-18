# 🎲 Dominó - Juego Premium

Juego profesional de dominó contra IA con 3 niveles de dificultad. 100% JavaScript vanilla, sin dependencias externas.

## 🎮 Características

### Juego Completo
- ✅ 28 fichas estándar (0-0 hasta 6-6)
- ✅ Reparto correcto: 7 fichas por jugador, 14 en el pozo
- ✅ Primer turno por doble más alta
- ✅ Sistema de robar del pozo
- ✅ Pasar turno automático
- ✅ Victoria por mano vacía o juego bloqueado
- ✅ Puntuación acumulativa

### Inteligencia Artificial (3 Niveles)

**Fácil:** Selección aleatoria inteligente
- Ideal para principiantes
- Jugadas válidas aleatorias

**Medio:** Estrategia heurística
- Prioriza fichas dobles (+25 pts)
- Reduce puntos en mano (+20 pts)
- Mantiene flexibilidad (+15 pts)
- Bloquea números del oponente (-10 pts)
- Considera jugadas futuras (+5 pts)

**Difícil:** Minimax con poda Alfa-Beta
- Profundidad 2-3 niveles
- Evaluación de posiciones
- Timeout de 1.5 segundos
- Optimización con caché

### Sistema de Audio
- 🎵 Efectos de sonido con Web Audio API
- 🔊 Controles de música y efectos
- 💾 Configuración persistente

### Diseño Responsive
- 📱 Mobile-first (< 600px)
- 📱 Tablet (601px - 900px)
- 💻 Escritorio (> 901px)
- 🎨 Animaciones fluidas
- 🌈 Paleta de colores profesional

### PWA (Progressive Web App)
- 📲 Instalable en dispositivos
- 🔌 Funcionamiento offline
- ⚡ Cache-first strategy
- 🔄 Auto-actualización

## 🚀 Instalación

### Opción 1: Abrir directamente
```bash
# Simplemente abre index.html en tu navegador
open index.html
```

### Opción 2: Servidor local
```bash
# Con Python 3
python3 -m http.server 8000

# Con Node.js
npx http-server -p 8000

# Luego visita http://localhost:8000
```

### Opción 3: Instalar como PWA
1. Abre el juego en Chrome/Edge/Safari
2. Busca el icono "Instalar" en la barra de direcciones
3. Haz clic en "Instalar"
4. El juego se instalará como aplicación standalone

## 📁 Estructura del Proyecto

```
domino-basico/
├── index.html           # Estructura HTML semántica
├── style.css            # Estilos responsive (16KB)
├── script.js            # Lógica completa del juego (41KB)
├── manifest.json        # Configuración PWA
├── service-worker.js    # Soporte offline
└── README.md            # Esta documentación
```

## 🎯 Cómo Jugar

### Reglas Básicas
1. Cada jugador recibe 7 fichas al inicio
2. El jugador con el doble más alto comienza
3. En tu turno, coloca una ficha que coincida con los extremos del tablero
4. Si no puedes jugar, roba del pozo
5. Si el pozo está vacío y no puedes jugar, pasa tu turno
6. Gana quien se quede sin fichas primero
7. Si el juego se bloquea (2 pases consecutivos), gana quien tenga menos puntos

### Controles
- **Click en ficha:** Seleccionar y jugar
- **Botón Robar:** Tomar ficha del pozo
- **Nueva Partida:** Reiniciar el juego
- **Selector de Dificultad:** Cambiar nivel de IA
- **🎵 / 🔊:** Alternar música y efectos

## 🛠️ Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Flexbox, Grid, Variables CSS
- **JavaScript ES6+** - Clases, Async/Await, Módulos
- **Web Audio API** - Sistema de sonido
- **Service Worker API** - Funcionamiento offline
- **localStorage API** - Persistencia de datos

## 🧠 Algoritmos Implementados

- **Fisher-Yates Shuffle** - Barajado aleatorio
- **Minimax con Alfa-Beta** - IA nivel difícil
- **Evaluación Heurística** - IA nivel medio
- **Detección de Bloqueo** - Lógica de fin de juego

## 🔧 Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 📊 Rendimiento

- ⚡ Carga inicial: < 100KB
- ⚡ Respuesta IA (fácil): 300-500ms
- ⚡ Respuesta IA (medio): 500-800ms
- ⚡ Respuesta IA (difícil): 800-1500ms

## 🐛 Debugging

El juego expone una instancia global para debugging:

```javascript
// Desde la consola del navegador
console.log(window.dominoGame);

// Ver estado del juego
console.log(window.dominoGame.getGameState());

// Ver mano del jugador
console.log(window.dominoGame.player.hand);

// Ver mano de la IA
console.log(window.dominoGame.ai.hand);
```

## 📝 Notas de Desarrollo

### Sin Dependencias
Este proyecto NO usa:
- ❌ Frameworks (React, Vue, Angular)
- ❌ Librerías externas (jQuery, Lodash)
- ❌ CDNs externos
- ❌ Preprocesadores (Sass, Less)
- ❌ Bundlers (Webpack, Vite)

Todo está implementado en **JavaScript vanilla puro**.

### Características Avanzadas
- Sistema de eventos personalizado
- Gestión de estado centralizada
- Animaciones CSS nativas
- Validación exhaustiva de movimientos
- Manejo robusto de errores
- Cache inteligente para PWA

## 🎨 Paleta de Colores

```css
--gradient-start: #1a2980;  /* Azul oscuro */
--gradient-end: #26d0ce;    /* Cian */
--player-color: #00b894;    /* Verde */
--ai-color: #e17055;        /* Naranja */
--success: #1dd1a1;         /* Verde claro */
--warning: #feca57;         /* Amarillo */
--danger: #ee5a6f;          /* Rojo */
```

## 🏆 Créditos

Desarrollado con ❤️ usando tecnologías web modernas.

**Versión:** 1.0.0  
**Última actualización:** Enero 2026

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

¡Disfruta jugando al dominó! 🎲🎉
