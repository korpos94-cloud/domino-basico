/**
 * Sistema de IA para el juego de dominó
 * Implementa 3 niveles de dificultad: Fácil, Medio, Difícil
 * @module AI
 */

import { getPlayableTiles } from './board.js';

/**
 * Nivel de dificultad de la IA
 * @type {string} - 'easy', 'medium', 'hard'
 */
let currentDifficulty = 'medium';

/**
 * Establece el nivel de dificultad de la IA
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 */
export function setAIDifficulty(difficulty) {
    if (['easy', 'medium', 'hard'].includes(difficulty)) {
        currentDifficulty = difficulty;
        console.log(`🤖 IA configurada en modo: ${difficulty}`);
    }
}

/**
 * Obtiene el nivel actual de dificultad
 * @returns {string} Nivel actual
 */
export function getAIDifficulty() {
    return currentDifficulty;
}

/**
 * Selecciona la mejor jugada según el nivel de dificultad
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano de la IA
 * @returns {Object|null} Jugada seleccionada o null
 */
export function selectBestMove(board, hand) {
    const playableTiles = getPlayableTiles(board, hand);

    if (playableTiles.length === 0) {
        return null;
    }

    switch (currentDifficulty) {
        case 'easy':
            return selectEasyMove(playableTiles);
        case 'medium':
            return selectMediumMove(board, hand, playableTiles);
        case 'hard':
            return selectHardMove(board, hand, playableTiles);
        default:
            return selectMediumMove(board, hand, playableTiles);
    }
}

/**
 * NIVEL FÁCIL: Selección completamente aleatoria
 * @param {Array} playableTiles - Fichas jugables
 * @returns {Object} Jugada seleccionada
 */
function selectEasyMove(playableTiles) {
    const randomIndex = Math.floor(Math.random() * playableTiles.length);
    const selected = playableTiles[randomIndex];

    // Seleccionar lado aleatorio si hay múltiples opciones
    const randomSide = selected.sides[Math.floor(Math.random() * selected.sides.length)];

    return {
        tile: selected.tile,
        side: randomSide
    };
}

/**
 * NIVEL MEDIO: Estrategia heurística con evaluación de jugadas
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano de la IA
 * @param {Array} playableTiles - Fichas jugables
 * @returns {Object} Mejor jugada según heurística
 */
function selectMediumMove(board, hand, playableTiles) {
    let bestMove = null;
    let bestScore = -Infinity;

    playableTiles.forEach(({ tile, sides }) => {
        sides.forEach(side => {
            const score = evaluateMoveHeuristic(board, hand, tile, side);

            if (score > bestScore) {
                bestScore = score;
                bestMove = { tile, side };
            }
        });
    });

    return bestMove || selectEasyMove(playableTiles);
}

/**
 * Evalúa una jugada con heurística
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano de la IA
 * @param {Object} tile - Ficha a evaluar
 * @param {string} side - Lado donde colocar
 * @returns {number} Puntuación heurística
 */
function evaluateMoveHeuristic(board, hand, tile, side) {
    let score = 0;

    // 1. Priorizar fichas dobles (+25 puntos)
    if (tile.a === tile.b) {
        score += 25;
    }

    // 2. Preferir fichas de alto valor para deshacerse de puntos (+20 max)
    const tileValue = tile.a + tile.b;
    score += (tileValue / 12) * 20; // Normalizado (12 es el máximo)

    // 3. Mantener flexibilidad: contar cuántas fichas quedan con ese número (+15 max)
    const endValue = side === 'left' ? board.leftValue : board.rightValue;
    const matchingValue = tile.a === endValue ? tile.b : tile.a;

    const flexibilityCount = hand.filter(t =>
        t.id !== tile.id && (t.a === matchingValue || t.b === matchingValue)
    ).length;
    score += flexibilityCount * 5;

    // 4. Evitar dejar números únicos (-10 si solo queda una ficha con ese número)
    const uniqueCount = hand.filter(t =>
        t.a === matchingValue || t.b === matchingValue
    ).length;
    if (uniqueCount === 1) {
        score -= 10;
    }

    // 5. Bonus por jugadas futuras (+5 por cada ficha jugable después)
    const remainingHand = hand.filter(t => t.id !== tile.id);
    const futurePlayable = countPlayableTilesAfterMove(board, remainingHand, tile, side);
    score += futurePlayable * 5;

    return score;
}

/**
 * Cuenta cuántas fichas serían jugables después de una jugada
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano restante
 * @param {Object} tile - Ficha jugada
 * @param {string} side - Lado donde se jugó
 * @returns {number} Cantidad de fichas jugables
 */
function countPlayableTilesAfterMove(board, hand, tile, side) {
    // Simular el tablero después de la jugada
    const newLeftValue = side === 'left' ?
        (tile.a === board.leftValue ? tile.b : tile.a) :
        board.leftValue;

    const newRightValue = side === 'right' ?
        (tile.a === board.rightValue ? tile.b : tile.a) :
        board.rightValue;

    return hand.filter(t =>
        t.a === newLeftValue || t.b === newLeftValue ||
        t.a === newRightValue || t.b === newRightValue
    ).length;
}

/**
 * NIVEL DIFÍCIL: Algoritmo Minimax simplificado
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano de la IA
 * @param {Array} playableTiles - Fichas jugables
 * @returns {Object} Mejor jugada según minimax
 */
function selectHardMove(board, hand, playableTiles) {
    let bestMove = null;
    let bestScore = -Infinity;

    // Evaluar cada jugada posible con minimax de profundidad 2
    playableTiles.forEach(({ tile, sides }) => {
        sides.forEach(side => {
            const score = minimaxEvaluate(board, hand, tile, side, 2);

            if (score > bestScore) {
                bestScore = score;
                bestMove = { tile, side };
            }
        });
    });

    return bestMove || selectMediumMove(board, hand, playableTiles);
}

/**
 * Evaluación minimax simplificada
 * @param {Object} board - Estado del tablero
 * @param {Array} hand - Mano de la IA
 * @param {Object} tile - Ficha a evaluar
 * @param {string} side - Lado donde colocar
 * @param {number} depth - Profundidad restante
 * @returns {number} Puntuación minimax
 */
function minimaxEvaluate(board, hand, tile, side, depth) {
    // Evaluación base con heurística
    let score = evaluateMoveHeuristic(board, hand, tile, side);

    // Si aún hay profundidad, simular jugadas futuras
    if (depth > 0) {
        const remainingHand = hand.filter(t => t.id !== tile.id);

        // Simular nuevos valores del tablero
        const newLeftValue = side === 'left' ?
            (tile.a === board.leftValue ? tile.b : tile.a) :
            board.leftValue;

        const newRightValue = side === 'right' ?
            (tile.a === board.rightValue ? tile.b : tile.a) :
            board.rightValue;

        const simulatedBoard = {
            ...board,
            leftValue: newLeftValue,
            rightValue: newRightValue
        };

        // Contar jugadas futuras posibles
        const futurePlayable = getPlayableTiles(simulatedBoard, remainingHand);

        if (futurePlayable.length > 0) {
            // Bonus por mantener opciones
            score += futurePlayable.length * 3;

            // Recursión limitada
            if (depth > 1) {
                const futureBestScore = Math.max(
                    ...futurePlayable.slice(0, 3).map(fp => // Limitar a 3 mejores para performance
                        minimaxEvaluate(simulatedBoard, remainingHand, fp.tile, fp.sides[0], depth - 1)
                    )
                );
                score += futureBestScore * 0.5; // Ponderar jugadas futuras
            }
        } else {
            // Penalizar si no quedan jugadas
            score -= 20;
        }
    }

    // Bonus extra si la jugada vacía la mano (victoria)
    if (hand.length === 1 && hand[0].id === tile.id) {
        score += 100;
    }

    return score;
}

/**
 * Obtiene un resumen de la estrategia de IA
 * @returns {Object} Información sobre la IA
 */
export function getAIInfo() {
    const descriptions = {
        easy: 'Juega aleatoriamente sin estrategia',
        medium: 'Usa heurísticas para evaluar jugadas',
        hard: 'Algoritmo minimax con planificación futura'
    };

    return {
        difficulty: currentDifficulty,
        description: descriptions[currentDifficulty]
    };
}
