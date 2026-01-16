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
    board: { width: 100, height: 200 },
    player: { width: 80, height: 160 },
    opponent: { width: 60, height: 120 },
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
            <div class="empty-board">
                <p>Mesa vacía</p>
                <p class="hint">Coloca la primera ficha para comenzar</p>
            </div>
        `;
    return;
  }

  // Crear contenedor para la mesa
  let boardHTML = '<div class="board-tiles">';

  // Mostrar extremo izquierdo
  if (board.leftValue !== null) {
    boardHTML += `
            <div class="board-end left-end">
                <div class="end-value">${board.leftValue}</div>
                <div class="end-label">Izquierda</div>
            </div>
        `;
  }

  // Mostrar fichas en la mesa
  board.tiles.forEach((tile, index) => {
    const isFirst = index === 0;
    const isLast = index === board.tiles.length - 1;
    const orientation = determineTileOrientation(index, board.tiles.length);

    boardHTML += `
            <div class="board-tile ${isFirst ? "first" : ""} ${
      isLast ? "last" : ""
    }" data-id="${tile.id}">
                ${renderTile(tile, {
                  ...uiConfig.tileSizes.board,
                  orientation: orientation,
                })}
                ${
                  uiConfig.animations.enabled
                    ? '<div class="tile-glow"></div>'
                    : ""
                }
            </div>
        `;
  });

  // Mostrar extremo derecho
  if (board.rightValue !== null) {
    boardHTML += `
            <div class="board-end right-end">
                <div class="end-value">${board.rightValue}</div>
                <div class="end-label">Derecha</div>
            </div>
        `;
  }

  boardHTML += "</div>";
  domRefs.board.innerHTML = boardHTML;

  // Añadir animaciones a las fichas recién colocadas
  if (gameState.lastAction?.includes("played")) {
    const lastPlayedTile = domRefs.board.querySelector(
      ".board-tile:last-child, .board-tile:first-child"
    );
    if (lastPlayedTile && uiConfig.animations.enabled) {
      lastPlayedTile.classList.add("new-tile");
      setTimeout(() => lastPlayedTile.classList.remove("new-tile"), 1000);
    }
  }
}

/**
 * Determina la orientación de una ficha en la mesa
 */
function determineTileOrientation(index, totalTiles) {
  // Lógica básica: alternar orientación para mejor visualización
  if (totalTiles <= 3) return "horizontal";
  return index % 2 === 0 ? "horizontal" : "vertical";
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
            <div class="player-tile ${isPlayable ? "playable" : ""}" 
                 data-id="${tile.id}"
                 data-playable="${isPlayable}"
                 onclick="window.handleTileClick('${tile.id}')">
                ${renderTile(tile, {
                  ...uiConfig.tileSizes.player,
                  color: uiConfig.colors.playerTile,
                })}
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
            <div class="opponent-tile" data-id="${tile.id}">
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
                  }
                )}
                <div class="tile-back"></div>
            </div>
        `;
  });

  handHTML += "</div>";

  // Añadir contador de fichas
  handHTML += `
        <div class="opponent-info">
            <div class="opponent-count">Fichas: ${hand.length}</div>
            ${
              gameState?.currentPlayer === "opponent"
                ? '<div class="opponent-thinking">Pensando...</div>'
                : ""
            }
        </div>
    `;

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

  const statsHTML = `
        <div class="game-stats">
            <div class="stat-item">
                <div class="stat-label">Fase</div>
                <div class="stat-value">${
                  stats.phase === "playing" ? "Jugando" : "Terminado"
                }</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Turno</div>
                <div class="stat-value">${
                  stats.currentPlayer === "player" ? "Jugador" : "Oponente"
                }</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Mesa</div>
                <div class="stat-value">${stats.boardTiles} fichas</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Pozo</div>
                <div class="stat-value">${stats.stockTiles} fichas</div>
            </div>
        </div>
    `;

  domRefs.stats.innerHTML = statsHTML;
}

/**
 * Actualiza el indicador de jugador actual
 */
function updateCurrentPlayerIndicator() {
  if (!domRefs.currentPlayer) return;

  const gameState = getGameState();
  if (!gameState) return;

  const playerText =
    gameState.currentPlayer === "player" ? "Tu turno" : "Turno del oponente";
  const playerClass =
    gameState.currentPlayer === "player" ? "player-turn" : "opponent-turn";

  domRefs.currentPlayer.innerHTML = `
        <div class="current-player-indicator ${playerClass}">
            <span class="indicator-dot"></span>
            <span class="indicator-text">${playerText}</span>
        </div>
    `;
}

/**
 * Actualiza las puntuaciones
 */
function updateScores() {
  if (!domRefs.playerScore || !domRefs.opponentScore) return;

  const gameState = getGameState();
  if (!gameState) return;

  domRefs.playerScore.textContent = gameState.playerScore;
  domRefs.opponentScore.textContent = gameState.opponentScore;
}

/**
 * Resalta las fichas jugables en la mano del jugador
 */
export function highlightPlayableTiles() {
  const playableTiles = getCurrentPlayerPlayableTiles();
  const playableIds = playableTiles.map((p) => p.tile.id);

  // Usar setTimeout para asegurar que el DOM esté actualizado
  setTimeout(() => {
    document.querySelectorAll(".player-tile").forEach((tileEl) => {
      const tileId = tileEl.dataset.id;
      if (playableIds.includes(tileId)) {
        tileEl.classList.add("highlighted");
        tileEl.style.boxShadow = `0 0 15px ${uiConfig.colors.playableHighlight}`;
      } else {
        tileEl.classList.remove("highlighted");
        tileEl.style.boxShadow = "";
      }
    });
  }, 50);
}

/**
 * Muestra un mensaje temporal
 * @param {string} text - Texto del mensaje
 * @param {string} type - Tipo: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duración en milisegundos
 */
export function showMessage(text, type = "info", duration = 3000) {
  const messageEl = document.createElement("div");
  messageEl.className = `toast-message ${type}`;
  messageEl.textContent = text;
  messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${getToastColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.style.animation = "slideOut 0.3s ease";
    setTimeout(() => document.body.removeChild(messageEl), 300);
  }, duration);
}

/**
 * Obtiene color para toast message
 */
function getToastColor(type) {
  const colors = {
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
  };
  return colors[type] || colors.info;
}

/**
 * Muestra un diálogo modal
 * @param {string} title - Título del diálogo
 * @param {string} content - Contenido HTML
 * @param {Array} buttons - Botones: [{text, action, type}]
 */
export function showDialog(title, content, buttons = []) {
  const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-content">${content}</div>
                <div class="modal-footer">
                    ${buttons
                      .map(
                        (btn) => `
                        <button class="modal-btn ${btn.type || "primary"}" 
                                onclick="${btn.action}">
                            ${btn.text}
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `;

  const modalContainer = document.createElement("div");
  modalContainer.id = "modal-container";
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Añadir estilos si no existen
  if (!document.querySelector("#modal-styles")) {
    const styles = document.createElement("style");
    styles.id = "modal-styles";
    styles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            }
            .modal-dialog {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                animation: scaleIn 0.3s ease;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .modal-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            .modal-btn.primary {
                background: #2196F3;
                color: white;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
    document.head.appendChild(styles);
  }

  window.closeModal = () => {
    document.body.removeChild(modalContainer);
  };
}

/**
 * Actualiza el estado de carga/espera
 * @param {boolean} isLoading - Si está cargando
 * @param {string} message - Mensaje de carga
 */
export function setLoading(isLoading, message = "Cargando...") {
  const loader = document.getElementById("loader") || createLoader();

  if (isLoading) {
    loader.style.display = "flex";
    loader.querySelector(".loader-message").textContent = message;
  } else {
    loader.style.display = "none";
  }
}

/**
 * Crea el elemento loader si no existe
 */
function createLoader() {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.9);
        display: none;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 3000;
    `;
  loader.innerHTML = `
        <div class="spinner"></div>
        <div class="loader-message" style="margin-top: 20px; color: #333;"></div>
    `;

  // Añadir estilos para el spinner
  const spinnerStyles = document.createElement("style");
  spinnerStyles.textContent = `
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #2196F3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
  document.head.appendChild(spinnerStyles);

  document.body.appendChild(loader);
  return loader;
}
