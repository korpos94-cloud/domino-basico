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
 * @property {number} round - Número de ronda actual
 * @property {number} playerWins - Victorias del jugador
 * @property {number} opponentWins - Victorias del oponente
 * @property {Object|null} pendingPlay - Jugada pendiente para selección de lado
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
    round: currentRound,
    totalRounds: totalRounds,
    playerWins: 0,
    opponentWins: 0,
    pendingPlay: null, // Para selección de lado
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
 * @param {string} side - Lado donde colocar: 'left', 'right', o null para auto-detectar
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

  // Validar jugadas posibles
  const leftPlay = canPlayLeft(gameState.board, tile);
  const rightPlay = canPlayRight(gameState.board, tile);

  // Si no se especificó lado y la ficha puede jugarse en ambos lados
  if (!side && leftPlay && rightPlay) {
    // Guardar jugada pendiente para que el jugador elija lado
    gameState.pendingPlay = {
      tile,
      tileIndex,
      leftPlay,
      rightPlay,
    };
    console.log("⚠️ Ficha puede jugarse en ambos lados. Requiere selección.");
    return false; // UI debe manejar selección de lado
  }

  // Determinar jugada según lado especificado o disponible
  let playInfo = null;
  if (side === "left" && leftPlay) {
    playInfo = leftPlay;
  } else if (side === "right" && rightPlay) {
    playInfo = rightPlay;
  } else if (!side) {
    // Auto-detectar: preferir izquierda si solo hay una opción
    playInfo = leftPlay || rightPlay;
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
    pendingPlay: null, // Limpiar jugada pendiente
  };

  // Verificar si el jugador ganó
  if (newPlayerHand.length === 0) {
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
 * Obtiene la jugada pendiente de selección de lado
 * @returns {Object|null} Información de jugada pendiente
 */
export function getPendingPlay() {
  return gameState?.pendingPlay || null;
}

/**
 * Confirma una jugada pendiente con el lado seleccionado
 * @param {string} side - 'left' o 'right'
 * @returns {boolean} True si la jugada fue exitosa
 */
export function confirmPendingPlay(side) {
  if (!gameState?.pendingPlay) {
    console.warn("No hay jugada pendiente");
    return false;
  }

  const { tile } = gameState.pendingPlay;
  return playerPlay(tile.id, side);
}

/**
 * Cancela una jugada pendiente
 */
export function cancelPendingPlay() {
  if (gameState) {
    gameState.pendingPlay = null;
  }
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
      
      // Verificar si después de robar puede jugar
      const playableAfterDraw = getPlayableTiles(
        gameState.board,
        gameState.opponentHand
      );
      
      if (playableAfterDraw.length === 0) {
        // No puede jugar después de robar, pasar turno
        gameState.lastAction = "opponent_drew_and_passed";
        gameState.currentPlayer = "player";
        console.log("🤖 Oponente robó ficha y pasó turno");
        return { action: "draw_and_pass", tile: drawnTile };
      }
      
      // Puede jugar después de robar, intentar jugar
      gameState.lastAction = "opponent_drew_tile";
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

  // Verificar si el oponente ganó
  if (newOpponentHand.length === 0) {
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
 * CORREGIDO: Mantiene turno si puede jugar después de robar
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

  // Verificar si después de robar el jugador tiene fichas jugables
  const playableAfterDraw = getPlayableTiles(gameState.board, gameState.playerHand);
  
  if (playableAfterDraw.length === 0) {
    // No tiene fichas jugables después de robar, pasar turno automáticamente
    gameState.currentPlayer = "opponent";
    console.log("🎯 Jugador robó ficha:", drawnTile.id, "- Sin jugadas, turno pasa a oponente");
  } else {
    // Tiene fichas jugables, mantener turno para que pueda jugar
    console.log("🎯 Jugador robó ficha:", drawnTile.id, "- Puede jugar");
  }

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
 * Permite al jugador pasar turno
 * CORREGIDO: Permite pasar sin restricciones de pozo
 * @returns {boolean} True si el turno se pasó exitosamente
 */
export function playerPassTurn() {
  if (
    !gameState ||
    gameState.phase !== "playing" ||
    gameState.currentPlayer !== "player"
  ) {
    console.warn("No es el turno del jugador");
    return false;
  }

  // Verificar si tiene fichas jugables
  const playableTiles = getPlayableTiles(gameState.board, gameState.playerHand);
  
  if (playableTiles.length > 0) {
    console.warn("No puedes pasar: tienes fichas jugables");
    return false;
  }

  // Si hay fichas en el pozo, debe robar primero
  if (gameState.stock.length > 0) {
    console.warn("No puedes pasar: debes robar del pozo primero");
    return false;
  }

  // Pasar turno
  gameState.currentPlayer = "opponent";
  gameState.lastAction = "player_passed";
  console.log("⏭️ Jugador pasó turno");
  
  return true;
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

    // Determinar ganador por menor puntuación
    const playerScore = calculateHandScore(gameState.playerHand);
    const opponentScore = calculateHandScore(gameState.opponentHand);

    if (playerScore < opponentScore) {
      const scoreDifference = opponentScore - playerScore;
      endGame("player", scoreDifference);
    } else if (opponentScore < playerScore) {
      const scoreDifference = playerScore - opponentScore;
      endGame("opponent", scoreDifference);
    } else {
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
 * Finaliza el juego
 * @param {string} winner - Ganador: 'player', 'opponent', 'draw'
 * @param {number} score - Puntuación a sumar al ganador
 */
function endGame(winner, score = 0) {
  gameState.phase = "finished";
  gameState.winner = winner;
  gameState.lastAction = `game_ended_${winner}`;

  if (winner === "player") {
    gameState.playerScore += score;
    gameState.playerWins += 1;
  } else if (winner === "opponent") {
    gameState.opponentScore += score;
    gameState.opponentWins += 1;
  }

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

  initGame({
    ...options,
    currentRound: round,
  });

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

  initGame({
    ...options,
    currentRound: 1,
  });

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
    round: gameState.round,
    totalRounds: gameState.totalRounds,
    playerWins: gameState.playerWins,
    opponentWins: gameState.opponentWins,
  };
}
