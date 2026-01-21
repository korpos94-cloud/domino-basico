/**
 * Sistema de interfaz de usuario para el juego de dominó
 * Gestiona la visualización e interacción con el juego
 * @module UI
 */

import { renderTile } from "./render.js";
import {
  getGameState,
  getCurrentPlayerPlayableTiles,
  getGameStats,
} from "./game.js";
import { getPlayableTiles } from "./board.js";

/**
 * Referencias a elementos DOM
 */
let domRefs = {
  board: null,
  playerHand: null,
  opponentHand: null,
  stock: null,
  message: null,
  stats: null,
  currentPlayer: null,
  playerScore: null,
  opponentScore: null,
};

/**
 * Configuración de la UI
 */
const uiConfig = {
  tileSizes: {
    board: { width: 50, height: 100 },
    player: { width: 70, height: 140 },
    opponent: { width: 50, height: 100 },
    stock: { width: 40, height: 80 },
  },
  colors: {
    playerTile: "#ffffff",
    opponentTile: "#e0e0e0",
    boardTile: "#f8f8f8",
    playableHighlight: "#4CAF50",
    currentPlayerHighlight: "#2196F3",
  },
  animations: {
    enabled: true,
    duration: 300,
  },
};

/**
 * Inicializa la interfaz de usuario
 * @param {Object} refs - Referencias a elementos DOM
 */
export function initUI(refs) {
  domRefs = { ...domRefs, ...refs };

  console.log("🎨 UI inicializada con referencias:", Object.keys(refs));
  updateUI();
}

/**
 * Actualiza toda la interfaz de usuario
 */
export function updateUI() {
  const gameState = getGameState();
  if (!gameState) return;

  updateBoard();
  updatePlayerHand();
  updateOpponentHand();
  updateStock();
  updateMessage();
  updateStats();
  updateCurrentPlayerIndicator();
  updateScores();

  // Resaltar fichas jugables si es el turno del jugador
  if (gameState.currentPlayer === "player" && gameState.phase === "playing") {
    highlightPlayableTiles();
  }
}

/**
 * Renderiza la mesa de juego
 */
function updateBoard() {
  if (!domRefs.board) return;

  const gameState = getGameState();
  const board = gameState?.board;

  if (!board || board.tiles.length === 0) {
    domRefs.board.innerHTML = `
            <div class="empty-board-message">
                <div class="empty-icon">🀰</div>
                <p>Mesa vacía</p>
                <p class="hint">Coloca la primera ficha para comenzar</p>
            </div>
        `;
    return;
  }

  // Crear estructura de la mesa esperada por CSS
  let boardHTML = '<div class="board-wrapper">';

  // Mostrar extremo izquierdo
  if (board.leftValue !== null) {
    boardHTML += `
            <div class="board-end-panel left-panel">
                <div class="end-label">Izquierda</div>
                <div class="end-value">${board.leftValue}</div>
            </div>
        `;
  }

  // Área de scroll para las fichas
  boardHTML += '<div class="board-tiles-scroll board-track">';

  // Renderizar fichas en la mesa
  board.tiles.forEach((tile, index) => {
    const isFirst = index === 0;
    const isLast = index === board.tiles.length - 1;
    const isNew =
      gameState.lastAction?.includes("played") && (isFirst || isLast);

    boardHTML += `
            <div class="tile-wrapper board-tile ${isFirst ? "first" : ""} ${
      isLast ? "last" : ""
    } ${isNew ? "new-tile" : ""}" data-id="${tile.id}">
                ${renderTile(tile, {
                  ...uiConfig.tileSizes.board,
                  orientation: "horizontal",
                })}
                <div class="tile-info">${tile.a}-${tile.b}</div>
            </div>
        `;
  });

  boardHTML += "</div>"; // Cerrar board-tiles-scroll

  // Mostrar extremo derecho
  if (board.rightValue !== null) {
    boardHTML += `
            <div class="board-end-panel right-panel">
                <div class="end-label">Derecha</div>
                <div class="end-value">${board.rightValue}</div>
            </div>
        `;
  }

  boardHTML += "</div>"; // Cerrar board-wrapper
  domRefs.board.innerHTML = boardHTML;

  // Manejar scroll automático al final si se añadió una ficha a la derecha
  if (gameState.lastAction === "player_played_right" || gameState.lastAction === "opponent_played_right") {
    const scrollArea = domRefs.board.querySelector(".board-tiles-scroll");
    if (scrollArea) {
      setTimeout(() => {
        scrollArea.scrollLeft = scrollArea.scrollWidth;
      }, 100);
    }
  }
}

/**
 * Renderiza la mano del jugador
 */
function updatePlayerHand() {
  if (!domRefs.playerHand) return;

  const gameState = getGameState();
  const hand = gameState?.playerHand || [];

  if (hand.length === 0) {
    domRefs.playerHand.innerHTML = `
            <div class="empty-hand player">
                <p>¡No tienes fichas!</p>
                <p class="hint">Espera tu turno o roba del pozo</p>
            </div>
        `;
    return;
  }

  let handHTML = '<div class="player-hand-tiles">';

  hand.forEach((tile) => {
    const playableInfo = getCurrentPlayerPlayableTiles().find(
      (p) => p.tile.id === tile.id
    );
    const isPlayable = !!playableInfo;

    handHTML += `
            <div class="tile-wrapper player-tile ${isPlayable ? "tile-playable" : ""}" 
                 data-id="${tile.id}"
                 data-playable="${isPlayable}"
                 onclick="window.handleTileClick('${tile.id}')">
                ${renderTile(tile, {
                  ...uiConfig.tileSizes.player,
                  color: uiConfig.colors.playerTile,
                  orientation: "vertical",
                })}
                <div class="tile-info">${tile.a}-${tile.b}</div>
                ${isPlayable ? '<div class="playable-indicator"></div>' : ""}
            </div>
        `;
  });

  handHTML += "</div>";
  domRefs.playerHand.innerHTML = handHTML;
}

/**
 * Renderiza la mano del oponente (oculta)
 */
function updateOpponentHand() {
  if (!domRefs.opponentHand) return;

  const gameState = getGameState();
  const hand = gameState?.opponentHand || [];

  let handHTML = '<div class="opponent-hand-tiles">';

  // Mostrar fichas boca abajo
  hand.forEach((tile) => {
    handHTML += `
            <div class="tile-wrapper opponent-tile" data-id="${tile.id}">
                ${renderTile(
                  {
                    a: 0,
                    b: 0,
                    id: "hidden",
                    isDouble: false,
                    orientation: "vertical",
                  },
                  {
                    ...uiConfig.tileSizes.opponent,
                    color: uiConfig.colors.opponentTile,
                    dotColor: uiConfig.colors.opponentTile,
                    orientation: "vertical",
                  }
                )}
                <div class="tile-back"></div>
            </div>
        `;
  });

  handHTML += "</div>";
  domRefs.opponentHand.innerHTML = handHTML;
}

/**
 * Renderiza el pozo de fichas
 */
function updateStock() {
  if (!domRefs.stock) return;

  const gameState = getGameState();
  const stock = gameState?.stock || [];

  let stockHTML = '<div class="stock-pile">';

  if (stock.length === 0) {
    stockHTML = '<div class="empty-stock">Pozo vacío</div>';
  } else {
    // Mostrar algunas fichas del pozo (máximo 5)
    const displayTiles = Math.min(stock.length, 5);

    for (let i = 0; i < displayTiles; i++) {
      const depth = i * 2;
      stockHTML += `
                <div class="stock-tile" style="transform: translateY(${depth}px)" 
                     onclick="window.handleDrawClick()">
                    ${renderTile(
                      {
                        a: 0,
                        b: 0,
                        id: "stock",
                        isDouble: false,
                        orientation: "vertical",
                      },
                      {
                        ...uiConfig.tileSizes.stock,
                        color: "#cccccc",
                        dotColor: "#cccccc",
                        borderRadius: 4,
                        orientation: "vertical",
                      }
                    )}
                </div>
            `;
    }

    stockHTML += `
            <div class="stock-count">
                <span class="count">${stock.length}</span>
                <span class="label">fichas</span>
            </div>
        `;
  }

  domRefs.stock.innerHTML = stockHTML;
}

/**
 * Actualiza el mensaje de estado
 */
function updateMessage() {
  if (!domRefs.message) return;

  const gameState = getGameState();
  if (!gameState) return;

  let message = "";
  let messageType = "info";

  switch (gameState.phase) {
    case "setup":
      message = "Preparando juego...";
      break;
    case "playing":
      if (gameState.currentPlayer === "player") {
        const playable = getCurrentPlayerPlayableTiles();
        if (playable.length > 0) {
          message = "Tu turno - Selecciona una ficha para jugar";
        } else {
          message =
            "Tu turno - No tienes fichas jugables. Roba del pozo o pasa turno";
          messageType = "warning";
        }
      } else {
        message = "Turno del oponente...";
      }
      break;
    case "finished":
      if (gameState.winner === "player") {
        message = "🎉 ¡Has ganado! 🎉";
        messageType = "success";
      } else if (gameState.winner === "opponent") {
        message = "😔 El oponente ganó. ¡Inténtalo de nuevo!";
        messageType = "error";
      } else {
        message = "🤝 Empate";
        messageType = "info";
      }
      break;
  }

  domRefs.message.innerHTML = `
        <div class="message ${messageType}">
            ${message}
        </div>
    `;
}

/**
 * Actualiza las estadísticas del juego
 */
function updateStats() {
  if (!domRefs.stats) return;

  const stats = getGameStats();
  if (!stats) return;

  // En index.html, domRefs.stats apunta a un contenedor que ya tiene estructura.
  // Solo actualizamos los valores si los elementos existen.
  const roundEl = document.getElementById('roundNumber');
  const stockEl = document.getElementById('stockCount');
  const playerTilesEl = document.getElementById('playerCount');
  const opponentTilesEl = document.getElementById('opponentCount');
  const boardTilesEl = document.getElementById('boardCount');

  if (roundEl) roundEl.textContent = stats.round || 1;
  if (stockEl) stockEl.textContent = stats.stockCount;
  if (playerTilesEl) playerTilesEl.textContent = `${stats.playerTilesCount} fichas`;
  if (opponentTilesEl) opponentTilesEl.textContent = `${stats.opponentTilesCount} fichas`;
  if (boardTilesEl) boardTilesEl.textContent = `${stats.boardCount} fichas`;
}

/**
 * Actualiza el indicador de turno actual
 */
function updateCurrentPlayerIndicator() {
  if (!domRefs.currentPlayer) return;

  const gameState = getGameState();
  const isPlayerTurn = gameState.currentPlayer === "player";

  domRefs.currentPlayer.textContent = isPlayerTurn ? "Turno: Jugador" : "Turno: IA";
  // No cambiamos la clase si no estamos seguros de que CSS la soporte para este elemento específico
}

/**
 * Actualiza las puntuaciones
 */
function updateScores() {
  const stats = getGameStats();
  if (!stats) return;

  if (domRefs.playerScore) domRefs.playerScore.textContent = stats.playerScore;
  if (domRefs.opponentScore)
    domRefs.opponentScore.textContent = stats.opponentScore;
}

/**
 * Resalta las fichas jugables en la mano del jugador
 */
export function highlightPlayableTiles() {
  const playableTiles = getCurrentPlayerPlayableTiles();
  const handTiles = domRefs.playerHand?.querySelectorAll(".tile-wrapper");

  if (!handTiles) return;

  handTiles.forEach((tileElement) => {
    const tileId = tileElement.getAttribute("data-id");
    const isPlayable = playableTiles.some((p) => p.tile.id === tileId);

    if (isPlayable) {
      tileElement.classList.add("tile-playable");
      // Asegurarse de que el indicador exista
      if (!tileElement.querySelector(".playable-indicator")) {
        const indicator = document.createElement("div");
        indicator.className = "playable-indicator";
        tileElement.appendChild(indicator);
      }
    } else {
      tileElement.classList.remove("tile-playable");
      const indicator = tileElement.querySelector(".playable-indicator");
      if (indicator) indicator.remove();
    }
  });
}

/**
 * Muestra una animación de error en una ficha
 * @param {string} tileId - ID de la ficha
 */
export function animateTileError(tileId) {
  const tileElement = domRefs.playerHand?.querySelector(
    `[data-id="${tileId}"]`
  );
  if (tileElement) {
    tileElement.classList.add("tile-error");
    setTimeout(() => tileElement.classList.remove("tile-error"), 500);
  }
}

/**
 * Muestra una notificación temporal
 * @param {string} text - Texto de la notificación
 * @param {string} type - Tipo (info, success, error, warning)
 */
export function showNotification(text, type = "info") {
  const notification = document.createElement("div");
  notification.className = `ui-notification ${type}`;
  notification.textContent = text;

  document.body.appendChild(notification);

  // Animación de entrada
  setTimeout(() => notification.classList.add("show"), 10);

  // Eliminar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Muestra un mensaje en el área de mensajes (alias para compatibilidad)
 */
export function showMessage(text, type = "info") {
    if (!domRefs.message) return;

    domRefs.message.innerHTML = `
        <div class="message ${type}">
            ${text}
        </div>
    `;
}

/**
 * Muestra un modal con configuración personalizada
 * @param {Object} config - Configuración del modal
 * @param {string} config.title - Título del modal
 * @param {string} config.body - Contenido HTML del cuerpo
 * @param {string} config.icon - Emoji o icono opcional
 * @param {string} config.type - Tipo de modal: 'success', 'error', 'warning', 'info'
 * @param {Array} config.buttons - Array de botones [{text, callback, primary}]
 */
export function showModal(config) {
    const overlay = document.getElementById('modalOverlay');
    const container = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');

    if (!overlay || !container) {
        console.warn('⚠️ Elementos de modal no encontrados');
        return;
    }

    // Establecer tipo de modal (success, error, warning, info)
    container.className = 'modal-container';
    if (config.type) {
        container.classList.add(`modal-${config.type}`);
    }

    // Establecer título (con icono opcional)
    const titleContent = config.icon
        ? `<span>${config.icon}</span><span>${config.title}</span>`
        : config.title;
    titleEl.innerHTML = titleContent;

    // Establecer cuerpo
    bodyEl.innerHTML = config.body;

    // Crear botones
    if (config.buttons && config.buttons.length > 0) {
        footerEl.innerHTML = config.buttons.map(btn => {
            const btnClass = btn.primary ? 'modal-btn btn-primary' : 'modal-btn btn-secondary';
            return `
                <button class="${btnClass}" data-action="${btn.action || 'close'}">
                    ${btn.text}
                </button>
            `;
        }).join('');

        // Agregar event listeners a los botones
        footerEl.querySelectorAll('button').forEach((btnEl, index) => {
            btnEl.addEventListener('click', () => {
                if (config.buttons[index].callback) {
                    config.buttons[index].callback();
                }
                hideModal();
            });
        });
    } else {
        // Botón por defecto
        footerEl.innerHTML = `
            <button class="modal-btn btn-primary" onclick="hideGameModal()">
                Aceptar
            </button>
        `;
    }

    // Mostrar modal
    overlay.classList.add('show');

    // Cerrar con Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            hideModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            hideModal();
        }
    });
}

/**
 * Oculta el modal activo
 */
export function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

/**
 * Muestra un modal de victoria
 * @param {string} winner - 'player' o 'opponent'
 * @param {Object} stats - Estadísticas del juego
 */
export function showVictoryModal(winner, stats = {}) {
    const isPlayerWin = winner === 'player';

    const config = {
        title: isPlayerWin ? '¡Victoria!' : 'Derrota',
        icon: isPlayerWin ? '🏆' : '😔',
        type: isPlayerWin ? 'success' : 'error',
        body: `
            <div class="modal-icon">${isPlayerWin ? '🎉' : '💔'}</div>
            <p style="text-align: center; font-size: 1.2rem; font-weight: 600;">
                ${isPlayerWin
                    ? '¡Felicitaciones! Has ganado la partida'
                    : 'La IA ha ganado esta vez'}
            </p>
            ${stats.playerScore !== undefined ? `
                <div style="margin-top: 20px; display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">
                            ${stats.playerScore}
                        </div>
                        <div style="font-size: 0.9rem; color: #94a3b8;">Tú</div>
                    </div>
                    <div style="font-size: 2rem; color: #64748b;">-</div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">
                            ${stats.opponentScore}
                        </div>
                        <div style="font-size: 0.9rem; color: #94a3b8;">IA</div>
                    </div>
                </div>
            ` : ''}
        `,
        buttons: [
            {
                text: 'Jugar de nuevo',
                primary: true,
                callback: () => {
                    // El callback se manejará desde index.html
                    const event = new CustomEvent('newGameRequested');
                    document.dispatchEvent(event);
                }
            }
        ]
    };

    showModal(config);
}

/**
 * Muestra un modal de juego bloqueado
 * @param {Object} stats - Estadísticas del juego
 */
export function showBlockedModal(stats = {}) {
    const config = {
        title: 'Juego Bloqueado',
        icon: '🔒',
        type: 'warning',
        body: `
            <div class="modal-icon">🚫</div>
            <p style="text-align: center; font-size: 1.2rem; font-weight: 600;">
                Ningún jugador puede mover
            </p>
            <p style="text-align: center; margin-top: 10px;">
                El jugador con menos puntos gana
            </p>
            ${stats.playerPoints !== undefined && stats.opponentPoints !== undefined ? `
                <div style="margin-top: 20px; display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">
                            ${stats.playerPoints}
                        </div>
                        <div style="font-size: 0.9rem; color: #94a3b8;">Tus puntos</div>
                    </div>
                    <div style="font-size: 2rem; color: #64748b;">vs</div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">
                            ${stats.opponentPoints}
                        </div>
                        <div style="font-size: 0.9rem; color: #94a3b8;">Puntos IA</div>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 16px; font-weight: 600; color: ${stats.playerPoints < stats.opponentPoints ? '#10b981' : '#ef4444'};">
                    ${stats.playerPoints < stats.opponentPoints ? '¡Tú ganas! 🎉' : 'IA gana 😔'}
                </p>
            ` : ''}
        `,
        buttons: [
            {
                text: 'Nueva partida',
                primary: true,
                callback: () => {
                    const event = new CustomEvent('newGameRequested');
                    document.dispatchEvent(event);
                }
            }
        ]
    };

    showModal(config);
}
