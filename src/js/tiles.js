/**
 * Sistema de gestión de fichas de dominó
 * Genera y manipula el conjunto completo de 28 fichas
 * @module Tiles
 */

/**
 * Representa una ficha de dominó con sus valores y propiedades
 * @typedef {Object} Tile
 * @property {number} a - Valor del extremo A (0-6)
 * @property {number} b - Valor del extremo B (0-6)
 * @property {string} id - Identificador único en formato "a-b"
 * @property {boolean} isDouble - Indica si es doble (a === b)
 * @property {string} orientation - Orientación actual: 'horizontal' o 'vertical'
 */

/**
 * Genera todas las 28 combinaciones únicas de fichas de dominó
 * @returns {Tile[]} Array con las 28 fichas
 */
export function generateTiles() {
    const tiles = [];
    
    for (let a = 0; a <= 6; a++) {
        for (let b = a; b <= 6; b++) {
            tiles.push({
                a,
                b,
                id: `${a}-${b}`,
                isDouble: a === b,
                orientation: 'horizontal' // Orientación por defecto
            });
        }
    }
    
    return tiles;
}

/**
 * Verifica si una ficha es doble (mismo valor en ambos extremos)
 * @param {Tile} tile - Ficha a verificar
 * @returns {boolean} true si es doble
 */
export function isDouble(tile) {
    return tile.a === tile.b;
}

/**
 * Obtiene los valores de ambos extremos de la ficha
 * @param {Tile} tile - Ficha a consultar
 * @returns {[number, number]} Array con los valores [a, b]
 */
export function getEnds(tile) {
    return [tile.a, tile.b];
}

/**
 * Rota la ficha intercambiando sus extremos (solo lógicamente)
 * Útil para cuando la ficha se gira visualmente
 * @param {Tile} tile - Ficha a rotar
 * @returns {Tile} Nueva ficha con extremos intercambiados
 */
export function rotateTile(tile) {
    return {
        ...tile,
        a: tile.b,
        b: tile.a
    };
}

/**
 * Cambia la orientación de la ficha entre horizontal y vertical
 * @param {Tile} tile - Ficha a reorientar
 * @returns {Tile} Ficha con nueva orientación
 */
export function changeOrientation(tile) {
    return {
        ...tile,
        orientation: tile.orientation === 'horizontal' ? 'vertical' : 'horizontal'
    };
}

/**
 * Obtiene el valor total de la ficha (suma de ambos extremos)
 * @param {Tile} tile - Ficha a evaluar
 * @returns {number} Suma de a + b
 */
export function getTileValue(tile) {
    return tile.a + tile.b;
}

/**
 * Filtra fichas por valor mínimo en al menos un extremo
 * @param {Tile[]} tiles - Array de fichas
 * @param {number} minValue - Valor mínimo requerido
 * @returns {Tile[]} Fichas que cumplen el criterio
 */
export function filterByMinValue(tiles, minValue) {
    return tiles.filter(tile => tile.a >= minValue || tile.b >= minValue);
}

/**
 * Ordena fichas por valor total descendente
 * @param {Tile[]} tiles - Array de fichas
 * @returns {Tile[]} Fichas ordenadas
 */
export function sortByValue(tiles) {
    return [...tiles].sort((a, b) => getTileValue(b) - getTileValue(a));
}

/**
 * Busca fichas que contengan un valor específico en algún extremo
 * @param {Tile[]} tiles - Array de fichas
 * @param {number} value - Valor a buscar (0-6)
 * @returns {Tile[]} Fichas que contienen el valor
 */
export function findTilesWithValue(tiles, value) {
    return tiles.filter(tile => tile.a === value || tile.b === value);
}

/**
 * Exporta el conjunto completo de fichas como módulo principal
 */
export const allTiles = generateTiles();