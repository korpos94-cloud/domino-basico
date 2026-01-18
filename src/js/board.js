/**
 * Sistema de mesa y validación de jugadas de dominó
 * Maneja la lógica de colocación de fichas en la mesa
 * @module Board
 */

/**
 * Representa el estado de la mesa de dominó
 * @typedef {Object} BoardState
 * @property {Array} tiles - Fichas colocadas en orden
 * @property {number|null} leftValue - Valor del extremo izquierdo abierto
 * @property {number|null} rightValue - Valor del extremo derecho abierto
 * @property {Array} history - Historial de jugadas para posible "deshacer"
 */

/**
 * Inicializa una nueva mesa vacía
 * @returns {BoardState} Estado inicial de la mesa
 */
export function initBoard() {
  return {
    tiles: [],
    leftValue: null,
    rightValue: null,
    history: [],
  };
}

/**
 * Valida si una ficha puede jugarse en el extremo izquierdo
 * @param {BoardState} board - Estado actual de la mesa
 * @param {Object} tile - Ficha a validar {a, b, id, isDouble}
 * @returns {Object|null} Información de jugada válida o null
 */
export function canPlayLeft(board, tile) {
  // Si la mesa está vacía, cualquier ficha es válida
  if (board.leftValue === null && board.rightValue === null) {
    return {
      tile: tile,
      side: "left",
      needsRotate: false,
      valid: true,
    };
  }

  // Verificar si el lado B coincide con leftValue (la ficha se conecta por su lado B)
  if (tile.b === board.leftValue) {
    return {
      tile: tile,
      side: "left",
      needsRotate: false,
      valid: true,
    };
  }

  // Verificar si el lado A coincide con leftValue (necesita rotar para conectar por B)
  if (tile.a === board.leftValue) {
    return {
      tile: { ...tile, a: tile.b, b: tile.a }, // Ficha rotada
      side: "left",
      needsRotate: true,
      valid: true,
    };
  }

  return null;
}

/**
 * Valida si una ficha puede jugarse en el extremo derecho
 * @param {BoardState} board - Estado actual de la mesa
 * @param {Object} tile - Ficha a validar {a, b, id, isDouble}
 * @returns {Object|null} Información de jugada válida o null
 */
export function canPlayRight(board, tile) {
  // Si la mesa está vacía, cualquier ficha es válida
  if (board.leftValue === null && board.rightValue === null) {
    return {
      tile: tile,
      side: "right",
      needsRotate: false,
      valid: true,
    };
  }

  // Verificar si el lado A coincide con rightValue (la ficha se conecta por su lado A)
  if (tile.a === board.rightValue) {
    return {
      tile: tile,
      side: "right",
      needsRotate: false,
      valid: true,
    };
  }

  // Verificar si el lado B coincide con rightValue (necesita rotar para conectar por A)
  if (tile.b === board.rightValue) {
    return {
      tile: { ...tile, a: tile.b, b: tile.a }, // Ficha rotada
      side: "right",
      needsRotate: true,
      valid: true,
    };
  }

  return null;
}

/**
 * Coloca una ficha en el extremo izquierdo de la mesa
 * @param {BoardState} board - Estado actual de la mesa
 * @param {Object} playInfo - Información de jugada válida de canPlayLeft
 * @returns {BoardState} Nuevo estado de la mesa
 */
export function placeLeft(board, playInfo) {
  // La ficha en playInfo.tile ya viene rotada si needsRotate=true
  const newTile = playInfo.tile;
  const newBoard = {
    ...board,
    tiles: [newTile, ...board.tiles], // Añadir al inicio
    history: [
      ...board.history,
      {
        action: "place",
        side: "left",
        tile: newTile,
        previousState: {
          leftValue: board.leftValue,
          rightValue: board.rightValue,
        },
      },
    ],
  };

  // Actualizar valores de extremos
  if (board.leftValue === null && board.rightValue === null) {
    // Primera ficha de la partida
    newBoard.leftValue = newTile.a;
    newBoard.rightValue = newTile.b;
  } else {
    // Ficha adicional - el extremo izquierdo queda con el valor A de la nueva ficha
    // El valor B de la nueva ficha debe coincidir con leftValue anterior
    newBoard.leftValue = newTile.a;
  }

  return newBoard;
}

/**
 * Coloca una ficha en el extremo derecho de la mesa
 * @param {BoardState} board - Estado actual de la mesa
 * @param {Object} playInfo - Información de jugada válida de canPlayRight
 * @returns {BoardState} Nuevo estado de la mesa
 */
export function placeRight(board, playInfo) {
  // La ficha en playInfo.tile ya viene rotada si needsRotate=true
  const newTile = playInfo.tile;
  const newBoard = {
    ...board,
    tiles: [...board.tiles, newTile], // Añadir al final
    history: [
      ...board.history,
      {
        action: "place",
        side: "right",
        tile: newTile,
        previousState: {
          leftValue: board.leftValue,
          rightValue: board.rightValue,
        },
      },
    ],
  };

  // Actualizar valores de extremos
  if (board.leftValue === null && board.rightValue === null) {
    // Primera ficha de la partida
    newBoard.leftValue = newTile.a;
    newBoard.rightValue = newTile.b;
  } else {
    // Ficha adicional - el extremo derecho queda con el valor B de la nueva ficha
    // El valor A de la nueva ficha debe coincidir con rightValue anterior
    newBoard.rightValue = newTile.b;
  }

  return newBoard;
}

/**
 * Encuentra todas las fichas jugables de una mano
 * @param {BoardState} board - Estado actual de la mesa
 * @param {Array} hand - Mano del jugador (array de fichas)
 * @returns {Array} Array de objetos con información de jugadas válidas
 */
export function getPlayableTiles(board, hand) {
  const playable = [];

  hand.forEach((tile) => {
    const leftPlay = canPlayLeft(board, tile);
    const rightPlay = canPlayRight(board, tile);

    if (leftPlay) {
      playable.push({
        tile: tile,
        playInfo: leftPlay,
        sides: ["left"],
      });
    }

    if (rightPlay) {
      // Evitar duplicados si la ficha es doble y puede jugarse en ambos lados
      const existing = playable.find((p) => p.tile.id === tile.id);
      if (existing) {
        existing.sides.push("right");
      } else {
        playable.push({
          tile: tile,
          playInfo: rightPlay,
          sides: ["right"],
        });
      }
    }
  });

  return playable;
}

/**
 * Calcula el número de fichas restantes que pueden jugar con un valor específico
 * @param {Array} allTiles - Todas las fichas del juego
 * @param {Array} playedTiles - Fichas ya jugadas
 * @param {Array} playerHand - Mano del jugador
 * @param {Array} opponentHand - Mano del oponente
 * @param {number} value - Valor a buscar (0-6)
 * @returns {number} Número de fichas restantes con ese valor
 */
export function countRemainingTilesWithValue(
  allTiles,
  playedTiles,
  playerHand,
  opponentHand,
  value
) {
  const playedIds = new Set(playedTiles.map((t) => t.id));
  const playerIds = new Set(playerHand.map((t) => t.id));
  const opponentIds = new Set(opponentHand.map((t) => t.id));

  return allTiles.filter(
    (tile) =>
      !playedIds.has(tile.id) &&
      !playerIds.has(tile.id) &&
      !opponentIds.has(tile.id) &&
      (tile.a === value || tile.b === value)
  ).length;
}

/**
 * Verifica si el juego está bloqueado (ningún jugador puede jugar)
 * @param {BoardState} board - Estado de la mesa
 * @param {Array} playerHand - Mano del jugador
 * @param {Array} opponentHand - Mano del oponente
 * @param {Array} stock - Fichas en el pozo
 * @returns {boolean} True si el juego está bloqueado
 */
export function isGameBlocked(board, playerHand, opponentHand, stock) {
  const playerCanPlay = getPlayableTiles(board, playerHand).length > 0;
  const opponentCanPlay = getPlayableTiles(board, opponentHand).length > 0;

  return !playerCanPlay && !opponentCanPlay && stock.length === 0;
}

/**
 * Obtiene estadísticas de la mesa
 * @param {BoardState} board - Estado de la mesa
 * @returns {Object} Estadísticas
 */
export function getBoardStats(board) {
  return {
    totalTiles: board.tiles.length,
    leftValue: board.leftValue,
    rightValue: board.rightValue,
    isFirstMove: board.tiles.length === 0,
    longestChain: board.tiles.length,
  };
}

/**
 * Reinicia la mesa manteniendo el historial
 * @param {BoardState} board - Estado actual de la mesa
 * @returns {BoardState} Mesa reiniciada
 */
export function resetBoard(board) {
  return {
    ...initBoard(),
    history: [
      ...board.history,
      {
        action: "reset",
        previousState: board,
      },
    ],
  };
}
