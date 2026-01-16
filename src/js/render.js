/**
 * Sistema de renderizado SVG para fichas de dominó
 * @module Render
 */

/**
 * Configuración por defecto para renderizado de fichas
 * @type {Object}
 */
const defaultOptions = {
    width: 80,
    height: 160,
    color: '#ffffff',
    dotColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 8,
    orientation: 'vertical',
    highlight: false,
    highlightColor: '#4CAF50'
};

/**
 * Patrones de puntos para cada valor (0-6)
 * Coordenadas normalizadas (0-1) en una cuadrícula 2x2 para cada mitad
 */
const dotPatterns = {
    0: [],
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75], [0.5, 0.5]],
    6: [[0.25, 0.2], [0.25, 0.5], [0.25, 0.8], [0.75, 0.2], [0.75, 0.5], [0.75, 0.8]]
};

/**
 * Calcula el radio del punto basado en el tamaño de la ficha
 * @param {number} size - Tamaño de referencia (ancho o alto)
 * @returns {number} Radio del punto
 */
function calculateDotRadius(size) {
    return Math.max(4, size * 0.08);
}

/**
 * Genera los puntos SVG para un valor dado en una posición específica
 * @param {number} value - Valor del extremo (0-6)
 * @param {Object} area - Área {x, y, width, height} donde dibujar
 * @param {Object} options - Opciones de renderizado
 * @returns {string} SVG de los puntos
 */
function generateDots(value, area, options) {
    if (value < 0 || value > 6) return '';
    
    const pattern = dotPatterns[value];
    if (!pattern || pattern.length === 0) return '';
    
    const dotRadius = calculateDotRadius(Math.min(area.width, area.height));
    
    return pattern.map(([nx, ny]) => {
        const x = area.x + (nx * area.width);
        const y = area.y + (ny * area.height);
        return `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${options.dotColor}" />`;
    }).join('\n');
}

/**
 * Renderiza una ficha de dominó como SVG
 * @param {Object} tile - Ficha a renderizar {a, b, id, orientation}
 * @param {Object} userOptions - Opciones de personalización
 * @returns {string} SVG completo como string
 */
export function renderTile(tile, userOptions = {}) {
    // Combinar opciones con valores por defecto
    const options = { ...defaultOptions, ...userOptions };
    
    // Determinar dimensiones según orientación
    const isVertical = options.orientation === 'vertical';
    const width = isVertical ? options.width : options.height;
    const height = isVertical ? options.height : options.width;
    
    // Calcular áreas para cada mitad
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    
    // Definir áreas para los puntos
    const topHalf = {
        x: options.borderWidth,
        y: options.borderWidth,
        width: width - (2 * options.borderWidth),
        height: halfHeight - options.borderWidth
    };
    
    const bottomHalf = {
        x: options.borderWidth,
        y: halfHeight + options.borderWidth,
        width: width - (2 * options.borderWidth),
        height: halfHeight - (2 * options.borderWidth)
    };
    
    const leftHalf = {
        x: options.borderWidth,
        y: options.borderWidth,
        width: halfWidth - options.borderWidth,
        height: height - (2 * options.borderWidth)
    };
    
    const rightHalf = {
        x: halfWidth + options.borderWidth,
        y: options.borderWidth,
        width: halfWidth - (2 * options.borderWidth),
        height: height - (2 * options.borderWidth)
    };
    
    // Determinar áreas según orientación
    const firstHalf = isVertical ? topHalf : leftHalf;
    const secondHalf = isVertical ? bottomHalf : rightHalf;
    
    // Determinar qué valores van en cada mitad según orientación de la ficha
    const firstValue = tile.orientation === options.orientation ? tile.a : tile.b;
    const secondValue = tile.orientation === options.orientation ? tile.b : tile.a;
    
    // Generar línea divisoria
    const dividerLine = isVertical 
        ? `<line x1="${options.borderWidth}" y1="${halfHeight}" x2="${width - options.borderWidth}" y2="${halfHeight}" stroke="${options.borderColor}" stroke-width="${options.borderWidth}" />`
        : `<line x1="${halfWidth}" y1="${options.borderWidth}" x2="${halfWidth}" y2="${height - options.borderWidth}" stroke="${options.borderColor}" stroke-width="${options.borderWidth}" />`;
    
    // Generar efecto de highlight si está activado
    const highlightEffect = options.highlight 
        ? `<rect x="0" y="0" width="${width}" height="${height}" rx="${options.borderRadius}" ry="${options.borderRadius}" fill="${options.highlightColor}" fill-opacity="0.2" />`
        : '';
    
    // Construir SVG
    const svg = `
<svg class="domino-tile" data-id="${tile.id}" data-value="${firstValue}-${secondValue}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${highlightEffect}
    <!-- Fondo de la ficha -->
    <rect x="0" y="0" width="${width}" height="${height}" rx="${options.borderRadius}" ry="${options.borderRadius}" 
          fill="${options.color}" stroke="${options.borderColor}" stroke-width="${options.borderWidth}" />
    
    <!-- Línea divisoria -->
    ${dividerLine}
    
    <!-- Puntos del primer extremo -->
    ${generateDots(firstValue, firstHalf, options)}
    
    <!-- Puntos del segundo extremo -->
    ${generateDots(secondValue, secondHalf, options)}
</svg>`;
    
    return svg;
}

/**
 * Renderiza todas las fichas en un contenedor HTML
 * @param {string} containerId - ID del elemento contenedor
 * @param {Object[]} tiles - Array de fichas a renderizar
 * @param {Object} options - Opciones de renderizado
 */
export function renderAllTiles(containerId, tiles, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor con ID "${containerId}" no encontrado`);
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear grid para organizar las fichas
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(7, 1fr)';
    container.style.gap = '10px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    
    // Renderizar cada ficha
    tiles.forEach(tile => {
        const tileWrapper = document.createElement('div');
        tileWrapper.className = 'tile-wrapper';
        tileWrapper.style.display = 'flex';
        tileWrapper.style.flexDirection = 'column';
        tileWrapper.style.alignItems = 'center';
        tileWrapper.style.cursor = 'pointer';
        tileWrapper.style.transition = 'transform 0.2s';
        
        // Añadir información de la ficha
        const tileInfo = document.createElement('div');
        tileInfo.className = 'tile-info';
        tileInfo.style.fontSize = '12px';
        tileInfo.style.marginTop = '5px';
        tileInfo.style.color = '#666';
        tileInfo.textContent = `${tile.a}-${tile.b}`;
        
        // Renderizar SVG
        tileWrapper.innerHTML = renderTile(tile, options);
        tileWrapper.appendChild(tileInfo);
        
        // Añadir eventos interactivos
        tileWrapper.addEventListener('click', () => {
            console.log(`Ficha clickeada: ${tile.id} (${tile.a}-${tile.b})`);
            tileWrapper.style.transform = 'scale(1.05)';
            setTimeout(() => {
                tileWrapper.style.transform = 'scale(1)';
            }, 200);
        });
        
        tileWrapper.addEventListener('mouseenter', () => {
            tileWrapper.style.transform = 'translateY(-5px)';
        });
        
        tileWrapper.addEventListener('mouseleave', () => {
            tileWrapper.style.transform = 'translateY(0)';
        });
        
        container.appendChild(tileWrapper);
    });
}

/**
 * Crea un elemento DOM a partir de un string SVG
 * @param {string} svgString - String SVG
 * @returns {SVGElement} Elemento SVG
 */
export function createSVGElement(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    return doc.documentElement;
}

/**
 * Renderiza una ficha específica y la inserta en un elemento
 * @param {string} elementId - ID del elemento destino
 * @param {Object} tile - Ficha a renderizar
 * @param {Object} options - Opciones de renderizado
 */
export function renderTileToElement(elementId, tile, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento con ID "${elementId}" no encontrado`);
        return;
    }
    
    element.innerHTML = renderTile(tile, options);
}