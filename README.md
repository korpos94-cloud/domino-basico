# Domino Básico

Proyecto simple de dominó en JavaScript, creado para practicar lógica, estructura profesional de carpetas y un flujo de trabajo moderno con Git y GitHub.

## 🎯 Características

- Tablero generado dinámicamente
- Lógica inicial del juego
- Estructura profesional con carpetas separadas
- Flujo de ramas basado en GitHub Flow
- Preparado para añadir imágenes, sonidos y módulos JS

## 📁 Estructura del proyecto

domino-basico/  
│  
├── index.html  
├── README.md  
├── .gitignore  
│  
└── src/  
  ├── js/  
  │  └── script.js  
  ├── css/  
  │  └── style.css  
  ├── img/  
  └── audio/

## 🚀 Cómo ejecutar el proyecto

1. Clonar el repositorio
2. Abrir la carpeta en VS Code
3. Instalar la extensión **Live Server**
4. Clic derecho en `index.html` → **Open with Live Server**

## 🛠 Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Git + GitHub
- VS Code con Prettier y Live Server

## 🧭 Roadmap (próximas mejoras)

- Añadir fichas del dominó
- Implementar reglas básicas
- Añadir sonidos
- Añadir animaciones
- Mejorar diseño visual
- Crear módulos JS separados para lógica, tablero y utilidades

## 👤 Autor

Proyecto creado por **Petru (korpos94-cloud)** como parte de su proceso de aprendizaje y profesionalización del flujo de trabajo. Con ayuda de Microsoft copilot.

🎵 Audio
El proyecto utiliza un flujo de audio ligero, pensado para entornos con recursos limitados (Windows 8, 6 GB RAM):

Edición principal: Audacity (creación y edición de efectos simples: clicks, errores, loops cortos).

Uso en el juego: los sonidos se exportan en formato OGG (principal) o MP3 y se guardan en:

text
src/audio/
Ejemplo de uso:

js
const clickSound = new Audio("src/audio/click.ogg");
clickSound.play();
🎨 Imágenes
Las fichas del dominó y la mayoría de elementos gráficos se gestionan de forma ligera y escalable:

Fichas del dominó: generadas por código usando SVG, sin depender de imágenes externas.

Iconos y UI: preferencia por SVG simples.

Fondos: colores y gradientes con CSS; solo se usan PNG ligeros si es necesario.

Los recursos gráficos externos (si los hay) se guardan en:

text
src/img/
📁 Estructura básica de assets
text
src/
├── audio/ # Sonidos del juego (OGG/MP3)
├── img/ # SVG o PNG puntuales
├── js/ # Lógica del juego
├── css/ # Estilos
└── index.html
