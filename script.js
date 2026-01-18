// ========================================
// DOMINÓ - JUEGO COMPLETO EN JAVASCRIPT
// ========================================

'use strict';

// ========================================
// CLASE TILE - Ficha de dominó
// ========================================
class Tile {
    constructor(left, right, id) {
        this.left = left;
        this.right = right;
        this.id = id;
    }

    isDouble() {
        return this.left === this.right;
    }

    getValue() {
        return this.left + this.right;
    }

    matches(value) {
        return this.left === value || this.right === value;
    }

    flip() {
        [this.left, this.right] = [this.right, this.left];
    }

    clone() {
        return new Tile(this.left, this.right, this.id);
    }

    toString() {
        return `[${this.left}|${this.right}]`;
    }
}

// ========================================
// CLASE BOARD - Tablero del juego
// ========================================
class Board {
    constructor() {
        this.tiles = [];
        this.leftEnd = null;
        this.rightEnd = null;
    }

    isEmpty() {
        return this.tiles.length === 0;
    }

    getEnds() {
        if (this.isEmpty()) {
            return { left: null, right: null };
        }
        return { left: this.leftEnd, right: this.rightEnd };
    }

    addTile(tile, position) {
        const tileCopy = tile.clone();

        if (this.isEmpty()) {
            this.tiles.push(tileCopy);
            this.leftEnd = tileCopy.left;
            this.rightEnd = tileCopy.right;
            return true;
        }

        if (position === 'left') {
            if (tileCopy.right === this.leftEnd) {
                this.tiles.unshift(tileCopy);
                this.leftEnd = tileCopy.left;
                return true;
            } else if (tileCopy.left === this.leftEnd) {
                tileCopy.flip();
                this.tiles.unshift(tileCopy);
                this.leftEnd = tileCopy.left;
                return true;
            }
        } else if (position === 'right') {
            if (tileCopy.left === this.rightEnd) {
                this.tiles.push(tileCopy);
                this.rightEnd = tileCopy.right;
                return true;
            } else if (tileCopy.right === this.rightEnd) {
                tileCopy.flip();
                this.tiles.push(tileCopy);
                this.rightEnd = tileCopy.right;
                return true;
            }
        }

        return false;
    }

    reset() {
        this.tiles = [];
        this.leftEnd = null;
        this.rightEnd = null;
    }

    getTiles() {
        return this.tiles;
    }
}

// ========================================
// CLASE PLAYER - Jugador
// ========================================
class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
    }

    addTile(tile) {
        this.hand.push(tile);
    }

    removeTile(tile) {
        const index = this.hand.findIndex(t => t.id === tile.id);
        if (index !== -1) {
            this.hand.splice(index, 1);
            return true;
        }
        return false;
    }

    hasTile(tileId) {
        return this.hand.some(t => t.id === tileId);
    }

    getPlayableTiles(board) {
        if (board.isEmpty()) {
            return this.hand.map(t => ({ tile: t, positions: ['left'] }));
        }

        const ends = board.getEnds();
        const playable = [];

        for (const tile of this.hand) {
            const positions = [];
            if (tile.matches(ends.left)) {
                positions.push('left');
            }
            if (tile.matches(ends.right)) {
                positions.push('right');
            }
            if (positions.length > 0) {
                playable.push({ tile, positions });
            }
        }

        return playable;
    }

    getHandValue() {
        return this.hand.reduce((sum, tile) => sum + tile.getValue(), 0);
    }

    reset() {
        this.hand = [];
    }

    getHandSize() {
        return this.hand.length;
    }
}

// ========================================
// CLASE AI - Inteligencia Artificial
// ========================================
class AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.thinkingTime = 800; // ms
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    async makeMove(player, board, pool) {
        await this.simulateThinking();

        const playableTiles = player.getPlayableTiles(board);

        if (playableTiles.length === 0) {
            return null; // No puede jugar
        }

        switch (this.difficulty) {
            case 'easy':
                return this.easyMove(playableTiles);
            case 'medium':
                return this.mediumMove(playableTiles, player, board);
            case 'hard':
                return this.hardMove(playableTiles, player, board, pool);
            default:
                return this.mediumMove(playableTiles, player, board);
        }
    }

    async simulateThinking() {
        const baseTime = this.thinkingTime;
        const variance = Math.random() * 400 - 200;
        await new Promise(resolve => setTimeout(resolve, baseTime + variance));
    }

    // Nivel Fácil: Selección aleatoria
    easyMove(playableTiles) {
        const randomIndex = Math.floor(Math.random() * playableTiles.length);
        const selected = playableTiles[randomIndex];
        const randomPosition = selected.positions[Math.floor(Math.random() * selected.positions.length)];

        return {
            tile: selected.tile,
            position: randomPosition
        };
    }

    // Nivel Medio: Heurística con puntajes
    mediumMove(playableTiles, player, board) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const playable of playableTiles) {
            for (const position of playable.positions) {
                const score = this.evaluateMove(playable.tile, position, player, board);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { tile: playable.tile, position };
                }
            }
        }

        return bestMove;
    }

    evaluateMove(tile, position, player, board) {
        let score = 0;

        // Prioridad 1: Jugar dobles (+25 puntos)
        if (tile.isDouble()) {
            score += 25;
        }

        // Prioridad 2: Reducir puntos en mano (+20 puntos por valor)
        score += tile.getValue() * 2;

        // Prioridad 3: Flexibilidad - fichas que aparecen más en la mano
        const leftCount = player.hand.filter(t => t.matches(tile.left)).length;
        const rightCount = player.hand.filter(t => t.matches(tile.right)).length;
        score += (leftCount + rightCount) * 3;

        // Prioridad 4: Bloquear extremos si quedan pocas fichas (-10 si deja número único)
        if (player.getHandSize() <= 3) {
            const value = position === 'left' ?
                (tile.left === board.getEnds().left ? tile.right : tile.left) :
                (tile.right === board.getEnds().right ? tile.left : tile.right);

            const hasMatch = player.hand.some(t => t.id !== tile.id && t.matches(value));
            if (!hasMatch) {
                score -= 10;
            }
        }

        // Prioridad 5: Jugadas futuras (+5 por cada ficha jugable después)
        const futurePlayable = player.hand.filter(t => {
            if (t.id === tile.id) return false;
            const newLeft = position === 'left' ?
                (tile.left === board.getEnds().left ? tile.right : tile.left) : board.getEnds().left;
            const newRight = position === 'right' ?
                (tile.right === board.getEnds().right ? tile.left : tile.right) : board.getEnds().right;
            return t.matches(newLeft) || t.matches(newRight);
        });
        score += futurePlayable.length * 5;

        return score;
    }

    // Nivel Difícil: Minimax con poda alfa-beta
    hardMove(playableTiles, player, board, pool) {
        const maxDepth = pool.length > 5 ? 2 : 3; // Profundidad adaptativa
        const timeLimit = 1500; // 1.5 segundos
        const startTime = Date.now();

        let bestMove = null;
        let bestScore = -Infinity;

        for (const playable of playableTiles) {
            for (const position of playable.positions) {
                if (Date.now() - startTime > timeLimit) {
                    // Timeout: retornar la mejor jugada encontrada hasta ahora
                    return bestMove || { tile: playable.tile, position };
                }

                const score = this.minimax(
                    playable.tile,
                    position,
                    player,
                    board,
                    pool,
                    maxDepth - 1,
                    -Infinity,
                    Infinity,
                    false,
                    startTime,
                    timeLimit
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { tile: playable.tile, position };
                }
            }
        }

        return bestMove || playableTiles[0] && {
            tile: playableTiles[0].tile,
            position: playableTiles[0].positions[0]
        };
    }

    minimax(tile, position, player, board, pool, depth, alpha, beta, isMaximizing, startTime, timeLimit) {
        // Verificar timeout
        if (Date.now() - startTime > timeLimit) {
            return this.evaluateMove(tile, position, player, board);
        }

        // Caso base
        if (depth === 0) {
            return this.evaluateMove(tile, position, player, board);
        }

        // Simular el movimiento
        const boardClone = this.cloneBoard(board);
        const tileClone = tile.clone();
        boardClone.addTile(tileClone, position);

        if (isMaximizing) {
            let maxEval = -Infinity;
            const playable = player.getPlayableTiles(boardClone);

            if (playable.length === 0) {
                return this.evaluateMove(tile, position, player, board);
            }

            for (const p of playable.slice(0, 3)) { // Limitar ramificación
                for (const pos of p.positions) {
                    const eval_score = this.minimax(
                        p.tile,
                        pos,
                        player,
                        boardClone,
                        pool,
                        depth - 1,
                        alpha,
                        beta,
                        false,
                        startTime,
                        timeLimit
                    );
                    maxEval = Math.max(maxEval, eval_score);
                    alpha = Math.max(alpha, eval_score);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            // Simplificación: asumir que el oponente juega decentemente
            const opponentScore = this.evaluateMove(tile, position, player, board);
            minEval = Math.min(minEval, -opponentScore);
            return minEval;
        }
    }

    cloneBoard(board) {
        const clone = new Board();
        clone.tiles = board.tiles.map(t => t.clone());
        clone.leftEnd = board.leftEnd;
        clone.rightEnd = board.rightEnd;
        return clone;
    }
}

// ========================================
// CLASE AUDIOMANAGER - Sistema de audio
// ========================================
class AudioManager {
    constructor() {
        this.context = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicOscillator = null;

        this.loadPreferences();
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);

            // Music gain
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);

            // SFX gain
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API no soportada:', e);
        }
    }

    resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    playSFX(type) {
        if (!this.sfxEnabled || !this.context) return;

        this.resumeContext();

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        switch (type) {
            case 'place': // Colocar ficha
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'draw': // Robar ficha
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.linearRampToValueAtTime(500, now + 0.05);
                oscillator.frequency.linearRampToValueAtTime(300, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'win': // Victoria
                [0, 0.1, 0.2].forEach((time, i) => {
                    const osc = this.context.createOscillator();
                    const gain = this.context.createGain();
                    osc.connect(gain);
                    gain.connect(this.sfxGain);

                    const freq = [523, 659, 784][i]; // C, E, G
                    osc.frequency.setValueAtTime(freq, now + time);
                    gain.gain.setValueAtTime(0.3, now + time);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.3);

                    osc.start(now + time);
                    osc.stop(now + time + 0.3);
                });
                break;

            case 'lose': // Derrota
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'click': // Click genérico
                oscillator.frequency.setValueAtTime(600, now);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;

            case 'pass': // Pasar turno
                oscillator.frequency.setValueAtTime(250, now);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.savePreferences();

        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }

        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.savePreferences();

        if (this.sfxEnabled) {
            this.playSFX('click');
        }

        return this.sfxEnabled;
    }

    startMusic() {
        if (!this.musicEnabled || !this.context || this.musicOscillator) return;

        this.resumeContext();

        // Música de fondo sutil (notas ambientales)
        this.musicOscillator = this.context.createOscillator();
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();

        this.musicOscillator.type = 'sine';
        this.musicOscillator.frequency.setValueAtTime(220, this.context.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.5, this.context.currentTime);
        lfoGain.gain.setValueAtTime(10, this.context.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(this.musicOscillator.frequency);
        this.musicOscillator.connect(this.musicGain);

        this.musicOscillator.start();
        lfo.start();
    }

    stopMusic() {
        if (this.musicOscillator) {
            try {
                this.musicOscillator.stop();
            } catch (e) {
                // Ignorar errores si ya estaba detenido
            }
            this.musicOscillator = null;
        }
    }

    loadPreferences() {
        try {
            const music = localStorage.getItem('dominoMusicEnabled');
            const sfx = localStorage.getItem('dominoSFXEnabled');

            if (music !== null) this.musicEnabled = music === 'true';
            if (sfx !== null) this.sfxEnabled = sfx === 'true';
        } catch (e) {
            console.warn('No se pudieron cargar las preferencias de audio:', e);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('dominoMusicEnabled', this.musicEnabled);
            localStorage.setItem('dominoSFXEnabled', this.sfxEnabled);
        } catch (e) {
            console.warn('No se pudieron guardar las preferencias de audio:', e);
        }
    }
}

// ========================================
// CLASE UI - Gestión de interfaz
// ========================================
class UI {
    constructor(game) {
        this.game = game;
        this.selectedTile = null;
        this.initElements();
    }

    initElements() {
        // Elementos principales
        this.boardElement = document.getElementById('board');
        this.playerHandElement = document.getElementById('playerHand');
        this.aiTileCountElement = document.getElementById('aiTileCount');
        this.playerTileCountElement = document.getElementById('playerTileCount');
        this.playerScoreElement = document.getElementById('playerScore');
        this.aiScoreElement = document.getElementById('aiScore');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.poolCountElement = document.getElementById('poolCount');
        this.historyListElement = document.getElementById('historyList');
        this.drawBtnElement = document.getElementById('drawBtn');
        this.playerTurnIndicator = document.getElementById('playerTurnIndicator');
        this.aiTurnIndicator = document.getElementById('aiTurnIndicator');

        // Modales
        this.endSelectionModal = document.getElementById('endSelectionModal');
        this.resultModal = document.getElementById('resultModal');
        this.leftEndBtn = document.getElementById('leftEndBtn');
        this.rightEndBtn = document.getElementById('rightEndBtn');
        this.leftEndValue = document.getElementById('leftEndValue');
        this.rightEndValue = document.getElementById('rightEndValue');
        this.resultIcon = document.getElementById('resultIcon');
        this.resultTitle = document.getElementById('resultTitle');
        this.resultMessage = document.getElementById('resultMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
    }

    updateBoard(board) {
        this.boardElement.innerHTML = '';

        const tiles = board.getTiles();
        tiles.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, 'board-tile');
            tileElement.classList.add('fade-in');
            this.boardElement.appendChild(tileElement);
        });
    }

    updatePlayerHand(player) {
        this.playerHandElement.innerHTML = '';

        player.hand.forEach(tile => {
            const tileElement = this.createTileElement(tile, 'player-tile');
            tileElement.dataset.tileId = tile.id;
            tileElement.addEventListener('click', () => this.onTileClick(tile));
            this.playerHandElement.appendChild(tileElement);
        });

        this.playerTileCountElement.textContent = player.getHandSize();
    }

    updateAIHand(ai) {
        this.aiTileCountElement.textContent = ai.getHandSize();
    }

    createTileElement(tile, cssClass = '') {
        const tileDiv = document.createElement('div');
        tileDiv.className = `tile ${cssClass}`;

        const leftHalf = document.createElement('div');
        leftHalf.className = 'tile-half';
        leftHalf.textContent = this.getDotPattern(tile.left);

        const rightHalf = document.createElement('div');
        rightHalf.className = 'tile-half';
        rightHalf.textContent = this.getDotPattern(tile.right);

        tileDiv.appendChild(leftHalf);
        tileDiv.appendChild(rightHalf);

        return tileDiv;
    }

    getDotPattern(number) {
        const patterns = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '⚆'];
        return patterns[number] || number;
    }

    onTileClick(tile) {
        if (this.game.currentPlayer !== this.game.player) return;
        if (this.game.isGameOver) return;

        this.game.audio.playSFX('click');

        const playableTiles = this.game.player.getPlayableTiles(this.game.board);
        const playable = playableTiles.find(p => p.tile.id === tile.id);

        if (!playable) {
            this.updateStatus('Esa ficha no se puede jugar en el tablero');
            return;
        }

        this.selectedTile = tile;

        // Si solo hay una posición posible, jugar directamente
        if (playable.positions.length === 1) {
            this.game.playTurn(tile, playable.positions[0]);
        } else {
            // Mostrar modal para seleccionar extremo
            this.showEndSelectionModal(playable.positions);
        }
    }

    showEndSelectionModal(positions) {
        const ends = this.game.board.getEnds();

        this.leftEndValue.textContent = this.getDotPattern(ends.left);
        this.rightEndValue.textContent = this.getDotPattern(ends.right);

        // Deshabilitar botones según las posiciones disponibles
        this.leftEndBtn.disabled = !positions.includes('left');
        this.rightEndBtn.disabled = !positions.includes('right');

        this.endSelectionModal.classList.add('active');
    }

    hideEndSelectionModal() {
        this.endSelectionModal.classList.remove('active');
    }

    showResultModal(winner, message) {
        if (winner === 'player') {
            this.resultIcon.textContent = '🎉';
            this.resultTitle.textContent = '¡Victoria!';
            this.game.audio.playSFX('win');
        } else if (winner === 'ai') {
            this.resultIcon.textContent = '😔';
            this.resultTitle.textContent = 'Derrota';
            this.game.audio.playSFX('lose');
        } else {
            this.resultIcon.textContent = '🤝';
            this.resultTitle.textContent = 'Empate';
        }

        this.resultMessage.textContent = message;
        this.resultModal.classList.add('active');
    }

    hideResultModal() {
        this.resultModal.classList.remove('active');
    }

    updateStatus(message) {
        this.gameStatusElement.textContent = message;
    }

    updateScores(playerScore, aiScore) {
        this.playerScoreElement.textContent = playerScore;
        this.aiScoreElement.textContent = aiScore;
    }

    updatePoolCount(count) {
        this.poolCountElement.textContent = count;
    }

    updateDrawButton(enabled) {
        this.drawBtnElement.disabled = !enabled;
    }

    updateTurnIndicators(isPlayerTurn) {
        if (isPlayerTurn) {
            this.playerTurnIndicator.classList.add('active');
            this.aiTurnIndicator.classList.remove('active');
        } else {
            this.playerTurnIndicator.classList.remove('active');
            this.aiTurnIndicator.classList.add('active');
        }
    }

    addToHistory(message) {
        // Remover mensaje vacío si existe
        const emptyMsg = this.historyListElement.querySelector('.history-empty');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const li = document.createElement('li');
        li.textContent = message;
        li.classList.add('slide-up');

        // Agregar al inicio
        this.historyListElement.insertBefore(li, this.historyListElement.firstChild);

        // Limitar a 10 entradas
        while (this.historyListElement.children.length > 10) {
            this.historyListElement.removeChild(this.historyListElement.lastChild);
        }
    }

    clearHistory() {
        this.historyListElement.innerHTML = '<li class="history-empty">Sin jugadas aún</li>';
    }

    highlightPlayableTiles(playableTiles) {
        // Remover todos los highlights
        document.querySelectorAll('.tile.player-tile').forEach(el => {
            el.classList.remove('playable', 'disabled');
        });

        // Resaltar jugables
        const playableIds = playableTiles.map(p => p.tile.id);
        document.querySelectorAll('.tile.player-tile').forEach(el => {
            const tileId = el.dataset.tileId;
            if (playableIds.includes(tileId)) {
                el.classList.add('playable');
            } else {
                el.classList.add('disabled');
            }
        });
    }
}

// ========================================
// CLASE DOMINOGAME - Lógica principal
// ========================================
class DominoGame {
    constructor() {
        this.board = new Board();
        this.player = new Player('Jugador');
        this.ai = new Player('IA');
        this.aiController = new AI('medium');
        this.audio = new AudioManager();
        this.ui = new UI(this);

        this.pool = [];
        this.currentPlayer = null;
        this.isGameOver = false;
        this.playerScore = 0;
        this.aiScore = 0;
        this.difficulty = 'medium';
        this.consecutivePasses = 0;

        this.initGame();
        this.setupEventListeners();
    }

    initGame() {
        this.ui.updateStatus('Haz clic en "Nueva Partida" para comenzar');
        this.ui.updateScores(0, 0);
        this.ui.updatePoolCount(0);
        this.ui.updateDrawButton(false);

        // Iniciar música de fondo
        if (this.audio.musicEnabled) {
            this.audio.startMusic();
        }
    }

    setupEventListeners() {
        // Botón nueva partida
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.audio.playSFX('click');
            this.startNewGame();
        });

        // Botón robar del pozo
        document.getElementById('drawBtn').addEventListener('click', () => {
            this.audio.playSFX('click');
            this.drawFromPool();
        });

        // Selector de dificultad
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.audio.playSFX('click');
            this.difficulty = e.target.value;
            this.aiController.setDifficulty(this.difficulty);
        });

        // Botones de modal de extremos
        document.getElementById('leftEndBtn').addEventListener('click', () => {
            this.audio.playSFX('click');
            if (this.ui.selectedTile) {
                this.playTurn(this.ui.selectedTile, 'left');
                this.ui.hideEndSelectionModal();
            }
        });

        document.getElementById('rightEndBtn').addEventListener('click', () => {
            this.audio.playSFX('click');
            if (this.ui.selectedTile) {
                this.playTurn(this.ui.selectedTile, 'right');
                this.ui.hideEndSelectionModal();
            }
        });

        // Botón jugar de nuevo
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.audio.playSFX('click');
            this.ui.hideResultModal();
            this.startNewGame();
        });

        // Botones de audio
        document.getElementById('musicToggle').addEventListener('click', (e) => {
            const enabled = this.audio.toggleMusic();
            e.currentTarget.classList.toggle('active', enabled);
        });

        document.getElementById('sfxToggle').addEventListener('click', (e) => {
            const enabled = this.audio.toggleSFX();
            e.currentTarget.classList.toggle('active', enabled);
        });

        // Cerrar modal al hacer clic fuera
        this.ui.endSelectionModal.addEventListener('click', (e) => {
            if (e.target === this.ui.endSelectionModal) {
                this.ui.hideEndSelectionModal();
            }
        });
    }

    startNewGame() {
        // Resetear estado
        this.board.reset();
        this.player.reset();
        this.ai.reset();
        this.pool = [];
        this.isGameOver = false;
        this.consecutivePasses = 0;
        this.ui.selectedTile = null;

        // Crear las 28 fichas del dominó (0-0 hasta 6-6)
        const allTiles = [];
        let id = 0;
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                allTiles.push(new Tile(i, j, id++));
            }
        }

        // Mezclar fichas
        this.shuffleArray(allTiles);

        // Repartir 7 fichas a cada jugador
        for (let i = 0; i < 7; i++) {
            this.player.addTile(allTiles.pop());
            this.ai.addTile(allTiles.pop());
        }

        // El resto va al pozo (14 fichas)
        this.pool = allTiles;

        // Determinar quién empieza (el que tiene la doble más alta)
        const playerDoubles = this.player.hand.filter(t => t.isDouble());
        const aiDoubles = this.ai.hand.filter(t => t.isDouble());

        const playerHighest = playerDoubles.length > 0 ?
            Math.max(...playerDoubles.map(t => t.left)) : -1;
        const aiHighest = aiDoubles.length > 0 ?
            Math.max(...aiDoubles.map(t => t.left)) : -1;

        if (playerHighest > aiHighest) {
            this.currentPlayer = this.player;
            this.ui.updateStatus('¡Tienes el doble más alto! Tu turno');
        } else if (aiHighest > playerHighest) {
            this.currentPlayer = this.ai;
            this.ui.updateStatus('La IA tiene el doble más alto. Turno de la IA');
        } else {
            // Si no hay dobles o son iguales, empieza el jugador
            this.currentPlayer = this.player;
            this.ui.updateStatus('Tu turno para comenzar');
        }

        // Actualizar UI
        this.ui.updateBoard(this.board);
        this.ui.updatePlayerHand(this.player);
        this.ui.updateAIHand(this.ai);
        this.ui.updatePoolCount(this.pool.length);
        this.ui.updateDrawButton(false);
        this.ui.clearHistory();
        this.ui.updateTurnIndicators(this.currentPlayer === this.player);

        // Si empieza la IA, hacer su jugada
        if (this.currentPlayer === this.ai) {
            setTimeout(() => this.aiTurn(), 500);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    playTurn(tile, position) {
        if (this.isGameOver) return;
        if (this.currentPlayer !== this.player) return;

        const success = this.board.addTile(tile, position);

        if (!success) {
            this.ui.updateStatus('Movimiento inválido');
            return;
        }

        // Remover ficha de la mano
        this.player.removeTile(tile);
        this.audio.playSFX('place');
        this.consecutivePasses = 0;

        // Actualizar UI
        this.ui.updateBoard(this.board);
        this.ui.updatePlayerHand(this.player);
        this.ui.addToHistory(`Jugador: ${tile.toString()} en ${position === 'left' ? 'izquierda' : 'derecha'}`);

        // Verificar victoria
        if (this.player.getHandSize() === 0) {
            this.endGame('player', 'player-wins');
            return;
        }

        // Cambiar turno
        this.switchTurn();
    }

    async aiTurn() {
        if (this.isGameOver) return;
        if (this.currentPlayer !== this.ai) return;

        this.ui.updateStatus('IA está pensando...');
        this.ui.updateDrawButton(false);

        // Obtener jugada de la IA
        const move = await this.aiController.makeMove(this.ai, this.board, this.pool);

        if (!move) {
            // La IA no puede jugar, intenta robar
            if (this.pool.length > 0) {
                const drawnTile = this.pool.pop();
                this.ai.addTile(drawnTile);
                this.audio.playSFX('draw');
                this.ui.updatePoolCount(this.pool.length);
                this.ui.updateAIHand(this.ai);
                this.ui.addToHistory('IA: Robó del pozo');

                // Intentar jugar la ficha robada
                const playableTiles = this.ai.getPlayableTiles(this.board);
                const canPlay = playableTiles.find(p => p.tile.id === drawnTile.id);

                if (canPlay) {
                    const position = canPlay.positions[0];
                    this.board.addTile(drawnTile, position);
                    this.ai.removeTile(drawnTile);
                    this.audio.playSFX('place');
                    this.ui.updateBoard(this.board);
                    this.ui.updateAIHand(this.ai);
                    this.ui.addToHistory(`IA: Jugó ${drawnTile.toString()} robada`);
                    this.consecutivePasses = 0;

                    if (this.ai.getHandSize() === 0) {
                        this.endGame('ai', 'ai-wins');
                        return;
                    }
                } else {
                    // No puede jugar la robada, pasa turno
                    this.consecutivePasses++;
                    this.audio.playSFX('pass');
                    this.ui.addToHistory('IA: Pasó turno (no puede jugar la robada)');
                }
            } else {
                // No puede jugar y no hay pozo, pasa turno
                this.consecutivePasses++;
                this.audio.playSFX('pass');
                this.ui.addToHistory('IA: Pasó turno (no hay fichas)');
            }

            // Verificar bloqueo
            if (this.consecutivePasses >= 2) {
                this.endGame(null, 'blocked');
                return;
            }

            this.switchTurn();
            return;
        }

        // Jugar la ficha
        this.board.addTile(move.tile, move.position);
        this.ai.removeTile(move.tile);
        this.audio.playSFX('place');
        this.consecutivePasses = 0;

        // Actualizar UI
        this.ui.updateBoard(this.board);
        this.ui.updateAIHand(this.ai);
        this.ui.addToHistory(`IA: ${move.tile.toString()} en ${move.position === 'left' ? 'izquierda' : 'derecha'}`);

        // Verificar victoria
        if (this.ai.getHandSize() === 0) {
            this.endGame('ai', 'ai-wins');
            return;
        }

        // Cambiar turno
        this.switchTurn();
    }

    drawFromPool() {
        if (this.pool.length === 0) {
            this.ui.updateStatus('El pozo está vacío');
            return;
        }

        if (this.currentPlayer !== this.player) return;

        const playableTiles = this.player.getPlayableTiles(this.board);
        if (playableTiles.length > 0) {
            this.ui.updateStatus('Debes jugar una ficha antes de robar');
            return;
        }

        // Robar ficha
        const drawnTile = this.pool.pop();
        this.player.addTile(drawnTile);
        this.audio.playSFX('draw');

        // Actualizar UI
        this.ui.updatePoolCount(this.pool.length);
        this.ui.updatePlayerHand(this.player);
        this.ui.addToHistory('Jugador: Robó del pozo');

        // Verificar si puede jugar la ficha robada
        const newPlayable = this.player.getPlayableTiles(this.board);
        const canPlayDrawn = newPlayable.find(p => p.tile.id === drawnTile.id);

        if (canPlayDrawn) {
            this.ui.updateStatus('Puedes jugar la ficha que robaste');
            this.ui.updateDrawButton(false);
            this.consecutivePasses = 0;
        } else {
            // No puede jugar, pasa turno
            this.consecutivePasses++;
            this.audio.playSFX('pass');
            this.ui.addToHistory('Jugador: Pasó turno (no puede jugar la robada)');
            this.ui.updateStatus('No puedes jugar la ficha robada. Turno de la IA');

            // Verificar bloqueo
            if (this.consecutivePasses >= 2) {
                this.endGame(null, 'blocked');
                return;
            }

            this.switchTurn();
        }
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === this.player ? this.ai : this.player;
        this.ui.updateTurnIndicators(this.currentPlayer === this.player);

        if (this.currentPlayer === this.player) {
            const playableTiles = this.player.getPlayableTiles(this.board);

            if (playableTiles.length === 0) {
                if (this.pool.length > 0) {
                    this.ui.updateStatus('No tienes jugadas. Roba del pozo');
                    this.ui.updateDrawButton(true);
                } else {
                    this.consecutivePasses++;
                    this.audio.playSFX('pass');
                    this.ui.addToHistory('Jugador: Pasó turno (no hay fichas)');
                    this.ui.updateStatus('No puedes jugar y el pozo está vacío');

                    if (this.consecutivePasses >= 2) {
                        this.endGame(null, 'blocked');
                        return;
                    }

                    setTimeout(() => this.switchTurn(), 1000);
                }
            } else {
                this.ui.updateStatus('Tu turno. Selecciona una ficha');
                this.ui.updateDrawButton(false);
            }
        } else {
            this.ui.updateStatus('Turno de la IA...');
            this.ui.updateDrawButton(false);
            setTimeout(() => this.aiTurn(), 800);
        }
    }

    endGame(winner, reason) {
        this.isGameOver = true;
        this.ui.updateDrawButton(false);

        let message = '';

        if (reason === 'player-wins') {
            this.playerScore++;
            const aiPoints = this.ai.getHandValue();
            message = `¡Ganaste la ronda! La IA tenía ${aiPoints} puntos en fichas.`;
        } else if (reason === 'ai-wins') {
            this.aiScore++;
            const playerPoints = this.player.getHandValue();
            message = `La IA ganó la ronda. Tenías ${playerPoints} puntos en fichas.`;
        } else if (reason === 'blocked') {
            // Juego bloqueado: gana quien tiene menos puntos
            const playerPoints = this.player.getHandValue();
            const aiPoints = this.ai.getHandValue();

            if (playerPoints < aiPoints) {
                winner = 'player';
                this.playerScore++;
                message = `Juego bloqueado. Ganaste con ${playerPoints} puntos vs ${aiPoints} de la IA.`;
            } else if (aiPoints < playerPoints) {
                winner = 'ai';
                this.aiScore++;
                message = `Juego bloqueado. La IA ganó con ${aiPoints} puntos vs ${playerPoints} tuyos.`;
            } else {
                winner = 'draw';
                message = `Juego bloqueado en empate. Ambos tienen ${playerPoints} puntos.`;
            }
        }

        this.ui.updateScores(this.playerScore, this.aiScore);
        this.ui.updateStatus('Juego terminado');
        this.ui.showResultModal(winner, message);
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // Inicializar el juego
    const game = new DominoGame();

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado:', reg))
            .catch(err => console.warn('Error al registrar Service Worker:', err));
    }

    // Hacer el juego accesible globalmente para debugging
    window.dominoGame = game;
}
