/**
 * Sistema principal del juego de dominó
 * Gestiona estado global, turnos y flujo del juego
 * @module Game
 */

import { generateTiles, isDouble, rotateTile } from "./tiles.js";
import {
  initBoard,
  canPlayLeft,
  canPlayRight,
  placeLeft,
  placeRight,
  getPlayableTiles,
  isGameBlocked,
  countRemainingTilesWithValue,
} from "./board.js";

/**
 * Estado global del juego
 * @typedef {Object} GameState
 * @property {string} phase - Fase del juego: 'setup', 'playing', 'finished'
 * @property {string} currentPlayer - 'player' o 'opponent'
 * @property {Array} playerHand - Mano del jugador humano
 * @property {Array} opponentHand - Mano del oponente IA
 * @property {Array} stock - Fichas restantes en el pozo
 * @property {Object} board - Estado de la mesa
 * @property {string} lastAction - Última acción realizada
 * @property {string} winner - Ganador: 'player', 'opponent', 'draw', o null
 * @property {number} playerScore - Puntuación del jugador
 * @property {number} opponentScore - Puntuación del oponente
 * @property {boolean} isBlocked - Si el juego está bloqueado
 * @property {Object} options - Opciones de configuración
 * @property {number} round - Número de ronda actual (nuevo para FASE 2)
 * @property {number} playerWins - Victorias del jugador (nuevo para FASE 2)
 * @property {number} opponentWins - Victorias del oponente (nuevo para FASE 2)
 */

// Estado global del juego
let gameState = null;

// Todas las fichas del juego (referencia estática)
const ALL_TILES = generateTiles();

/**
 * Inicializa una nueva partida
 * @param {Object} options - Opciones de configuración
 * @returns {GameState} Estado inicial del juego
 */
export function initGame(options = {}) {
  const {
    tilesPerPlayer = 7,
    startingPlayer = "random",
    enableHints = true,
    // Nuevas opciones para FASE 2 (preparación)
    totalRounds = 1,
    currentRound = 1,
  } = options;

  // Mezclar todas las fichas
  const shuffledTiles = [...ALL_TILES].sort(() => Math.random() - 0.5);

  // Repartir fichas
  const playerHand = shuffledTiles.slice(0, tilesPerPlayer);
  const opponentHand = shuffledTiles.slice(tilesPerPlayer, tilesPerPlayer * 2);
  const stock = shuffledTiles.slice(tilesPerPlayer * 2);

  // Determinar jugador inicial
  let currentPlayer = startingPlayer;
  if (startingPlayer === "random") {
    currentPlayer = Math.random() > 0.5 ? "player" : "opponent";
  } else if (startingPlayer === "double") {
    // El jugador con el doble más alto comienza
    const playerDoubles = playerHand.filter((t) => isDouble(t));
    const opponentDoubles = opponentHand.filter((t) => isDouble(t));

    const playerHighestDouble =
      playerDoubles.length > 0
        ? Math.max(...playerDoubles.map((t) => t.a))
        : -1;
    const opponentHighestDouble =
      opponentDoubles.length > 0
        ? Math.max(...opponentDoubles.map((t) => t.a))
        : -1;

    currentPlayer =
      playerHighestDouble >= opponentHighestDouble ? "player" : "opponent";
  }

  // Inicializar estado del juego con estructura para FASE 2
  gameState = {
    phase: "playing",
    currentPlayer,
    playerHand,
    opponentHand,
    stock,
    board: initBoard(),
    lastAction: "game_started",
    winner: null,
    playerScore: 0,
    opponentScore: 0,
    isBlocked: false,
    // Para FASE 2 (sistema de rondas)
    round: currentRound,
    totalRounds: totalRounds,
    playerWins: 0,
    opponentWins: 0,
    // Opciones
    options: {
      tilesPerPlayer,
      enableHints,
      totalRounds,
    },
  };

  console.log("🎮 Juego inicializado:", {
    playerTiles: playerHand.length,
    opponentTiles: opponentHand.length,
    stock: stock.length,
    startingPlayer: currentPlayer,
    round: currentRound,
  });

  return gameState;
}

/**
 * Obtiene el estado actual del juego
 * @returns {GameState} Estado del juego
 */
export function getGameState() {
  return gameState;
}

/**
 * Intenta que el jugador coloque una ficha
 * @param {string} tileId - ID de la ficha a colocar
 * @param {string} side - Lado donde colocar: 'left' o 'right'
 * @returns {boolean} True si la jugada fue exitosa
 */
export function playerPlay(tileId, side = null) {
  if (
    !gameState ||
    gameState.phase !== "playing" ||
    gameState.currentPlayer !== "player"
  ) {
    console.warn("No es el turno del jugador o el juego no está activo");
    return false;
  }

  // Buscar la ficha en la mano del jugador
  const tileIndex = gameState.playerHand.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) {
    console.warn("Ficha no encontrada en la mano del jugador:", tileId);
    return false;
  }

  const tile = gameState.playerHand[tileIndex];

  // Validar jugada
  let playInfo = null;
  if (side === "left" || side === null) {
    playInfo = canPlayLeft(gameState.board, tile);
  }
  if ((side === "right" || (side === null && !playInfo)) && !playInfo) {
    playInfo = canPlayRight(gameState.board, tile);
  }

  if (!playInfo) {
    console.warn("Jugada no válida:", { tileId, side });
    return false;
  }

  // Realizar jugada
  let newBoard;
  if (playInfo.side === "left") {
    newBoard = placeLeft(gameState.board, playInfo);
  } else {
    newBoard = placeRight(gameState.board, playInfo);
  }

  // Actualizar estado del juego
  const newPlayerHand = [...gameState.playerHand];
  newPlayerHand.splice(tileIndex, 1);

  gameState = {
    ...gameState,
    playerHand: newPlayerHand,
    board: newBoard,
    lastAction: `player_played_${tileId}_${playInfo.side}`,
    currentPlayer: "opponent",
  };

  // Verificar si el jugador ganó - CAMBIO FASE 1 (corrección puntuación)
  if (newPlayerHand.length === 0) {
    // El jugador se queda sin fichas: GANA y suma puntos del oponente
    const opponentScore = calculateHandScore(gameState.opponentHand);
    endGame("player", opponentScore);
    return true;
  }

  // Verificar si el juego está bloqueado
  checkGameBlocked();

  console.log("✅ Jugador jugó ficha:", tileId, "en", playInfo.side);
  return true;
}

/**
 * Hace que el oponente IA juegue una ficha
 * @returns {Object|null} Información de la jugada realizada
 */
export function aiPlay() {
  if (
    !gameState ||
    gameState.phase !== "playing" ||
    gameState.currentPlayer !== "opponent"
  ) {
    console.warn("No es el turno del oponente o el juego no está activo");
    return null;
  }

  // Estrategia IA simple: jugar la primera ficha válida
  const playableTiles = getPlayableTiles(
    gameState.board,
    gameState.opponentHand
  );

  if (playableTiles.length === 0) {
    // No puede jugar, intentar robar del pozo
    if (gameState.stock.length > 0) {
      const drawnTile = drawTileForOpponent();
      gameState.lastAction = "opponent_drew_tile";
      gameState.currentPlayer = "player";
      console.log("🤖 Oponente robó ficha del pozo");
      return { action: "draw", tile: drawnTile };
    } else {
      // Pasar turno
      gameState.lastAction = "opponent_passed";
      gameState.currentPlayer = "player";
      console.log("🤖 Oponente pasó turno");
      return { action: "pass" };
    }
  }

  // Seleccionar ficha para jugar (estrategia simple: primera disponible)
  const selectedPlay = playableTiles[0];
  const tile = selectedPlay.tile;
  const tileIndex = gameState.opponentHand.findIndex((t) => t.id === tile.id);

  // Usar el primer lado disponible
  const side = selectedPlay.sides[0];
  let playInfo;

  if (side === "left") {
    playInfo = canPlayLeft(gameState.board, tile);
  } else {
    playInfo = canPlayRight(gameState.board, tile);
  }

  // Realizar jugada
  let newBoard;
  if (playInfo.side === "left") {
    newBoard = placeLeft(gameState.board, playInfo);
  } else {
    newBoard = placeRight(gameState.board, playInfo);
  }

  // Actualizar estado del juego
  const newOpponentHand = [...gameState.opponentHand];
  newOpponentHand.splice(tileIndex, 1);

  gameState = {
    ...gameState,
    opponentHand: newOpponentHand,
    board: newBoard,
    lastAction: `opponent_played_${tile.id}_${playInfo.side}`,
    currentPlayer: "player",
  };

  // Verificar si el oponente ganó - CAMBIO FASE 1 (corrección puntuación)
  if (newOpponentHand.length === 0) {
    // El oponente se queda sin fichas: GANA y suma puntos del jugador
    const playerScore = calculateHandScore(gameState.playerHand);
    endGame("opponent", playerScore);
    return { action: "play", tile, side: playInfo.side, winner: "opponent" };
  }

  // Verificar si el juego está bloqueado
  checkGameBlocked();

  console.log("🤖 Oponente jugó ficha:", tile.id, "en", playInfo.side);
  return { action: "play", tile, side: playInfo.side };
}

/**
 * Roba una ficha del pozo para el jugador
 * @returns {Object|null} Ficha robada o null si no hay fichas
 */
export function playerDrawTile() {
  if (
    !gameState ||
    gameState.phase !== "playing" ||
    gameState.currentPlayer !== "player"
  ) {
    console.warn("No es el turno del jugador o el juego no está activo");
    return null;
  }

  if (gameState.stock.length === 0) {
    console.warn("No hay fichas en el pozo");
    return null;
  }

  const drawnTile = gameState.stock.pop();
  gameState.playerHand.push(drawnTile);
  gameState.lastAction = "player_drew_tile";
  gameState.currentPlayer = "opponent";

  console.log("🎯 Jugador robó ficha:", drawnTile.id);
  return drawnTile;
}

/**
 * Roba una ficha del pozo para el oponente (uso interno)
 * @returns {Object|null} Ficha robada
 */
function drawTileForOpponent() {
  if (gameState.stock.length === 0) return null;

  const drawnTile = gameState.stock.pop();
  gameState.opponentHand.push(drawnTile);
  return drawnTile;
}

/**
 * Verifica si el juego está bloqueado y actualiza el estado
 */
function checkGameBlocked() {
  const blocked = isGameBlocked(
    gameState.board,
    gameState.playerHand,
    gameState.opponentHand,
    gameState.stock
  );

  if (blocked && !gameState.isBlocked) {
    gameState.isBlocked = true;
    gameState.lastAction = "game_blocked";

    // Determinar ganador por menor puntuación - CAMBIO FASE 1 (lógica corregida)
    const playerScore = calculateHandScore(gameState.playerHand);
    const opponentScore = calculateHandScore(gameState.opponentHand);

    if (playerScore < opponentScore) {
      // Jugador tiene menos puntos: GANA y suma la diferencia
      const scoreDifference = opponentScore - playerScore;
      endGame("player", scoreDifference);
    } else if (opponentScore < playerScore) {
      // Oponente tiene menos puntos: GANA y suma la diferencia
      const scoreDifference = playerScore - opponentScore;
      endGame("opponent", scoreDifference);
    } else {
      // Empate exacto
      endGame("draw", 0);
    }
  }
}

/**
 * Calcula la puntuación de una mano
 * @param {Array} hand - Mano del jugador
 * @returns {number} Puntuación total
 */
function calculateHandScore(hand) {
  return hand.reduce((total, tile) => total + tile.a + tile.b, 0);
}

/**
 * Finaliza el juego - CAMBIO FASE 1 (función completamente corregida)
 * @param {string} winner - Ganador: 'player', 'opponent', 'draw'
 * @param {number} score - Puntuación a sumar al ganador
 */
function endGame(winner, score = 0) {
  gameState.phase = "finished";
  gameState.winner = winner;
  gameState.lastAction = `game_ended_${winner}`;

  // Lógica de puntuación corregida:
  // - Si winner es 'player', suma 'score' a playerScore
  // - Si winner es 'opponent', suma 'score' a opponentScore
  // - Si es 'draw', no suma puntos (score debería ser 0)

  if (winner === "player") {
    gameState.playerScore += score;
    gameState.playerWins += 1; // Para FASE 2
  } else if (winner === "opponent") {
    gameState.opponentScore += score;
    gameState.opponentWins += 1; // Para FASE 2
  }
  // En caso de 'draw', no se suman puntos ni victorias

  console.log(`🏆 Juego terminado. Ganador: ${winner}, Puntos: ${score}`);
}

/**
 * Obtiene fichas jugables para el jugador actual
 * @returns {Array} Fichas jugables con información de jugada
 */
export function getCurrentPlayerPlayableTiles() {
  if (!gameState || gameState.phase !== "playing") return [];

  if (gameState.currentPlayer === "player") {
    return getPlayableTiles(gameState.board, gameState.playerHand);
  } else {
    return getPlayableTiles(gameState.board, gameState.opponentHand);
  }
}

/**
 * Reinicia el juego manteniendo las puntuaciones
 * @returns {GameState} Nuevo estado del juego
 */
export function restartGame() {
  const options = gameState?.options || {};
  const playerScore = gameState?.playerScore || 0;
  const opponentScore = gameState?.opponentScore || 0;
  const playerWins = gameState?.playerWins || 0;
  const opponentWins = gameState?.opponentWins || 0;
  const round = (gameState?.round || 0) + 1;

  // Inicializar nueva partida con estado actualizado para FASE 2
  initGame({
    ...options,
    currentRound: round,
  });

  // Mantener puntuaciones y victorias acumuladas
  if (gameState) {
    gameState.playerScore = playerScore;
    gameState.opponentScore = opponentScore;
    gameState.playerWins = playerWins;
    gameState.opponentWins = opponentWins;
  }

  return gameState;
}

/**
 * Reinicia completamente el juego (puntuaciones a cero)
 * @returns {GameState} Nuevo estado del juego
 */
export function resetGame() {
  const options = gameState?.options || {};

  // Inicializar nueva partida desde cero
  initGame({
    ...options,
    currentRound: 1,
  });

  // Resetear puntuaciones y victorias
  if (gameState) {
    gameState.playerScore = 0;
    gameState.opponentScore = 0;
    gameState.playerWins = 0;
    gameState.opponentWins = 0;
  }

  return gameState;
}

/**
 * Obtiene estadísticas del juego
 * @returns {Object} Estadísticas
 */
export function getGameStats() {
  if (!gameState) return null;

  const playerPlayable = getPlayableTiles(
    gameState.board,
    gameState.playerHand
  );
  const opponentPlayable = getPlayableTiles(
    gameState.board,
    gameState.opponentHand
  );

  return {
    phase: gameState.phase,
    currentPlayer: gameState.currentPlayer,
    playerTiles: gameState.playerHand.length,
    opponentTiles: gameState.opponentHand.length,
    stockTiles: gameState.stock.length,
    boardTiles: gameState.board.tiles.length,
    playerPlayableTiles: playerPlayable.length,
    opponentPlayableTiles: opponentPlayable.length,
    playerScore: gameState.playerScore,
    opponentScore: gameState.opponentScore,
    isBlocked: gameState.isBlocked,
    winner: gameState.winner,
    // Nuevas estadísticas para FASE 2
    round: gameState.round,
    totalRounds: gameState.totalRounds,
    playerWins: gameState.playerWins,
    opponentWins: gameState.opponentWins,
  };
}
