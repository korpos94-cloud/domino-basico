/**
 * Sistema de audio para el juego de dominó
 * Gestiona música de fondo y efectos de sonido usando Web Audio API
 * @module Audio
 */

/**
 * Clase para gestionar el audio del juego
 */
export class AudioManager {
    constructor() {
        this.context = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.7;
        this.musicSource = null;
        this.musicGain = null;
        this.isPlaying = false;

        this.initAudioContext();
        this.loadSettings();
    }

    /**
     * Inicializa el contexto de audio
     */
    initAudioContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎵 Audio Context inicializado');
        } catch (e) {
            console.warn('⚠️ Web Audio API no soportada:', e);
        }
    }

    /**
     * Carga la configuración desde localStorage
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('domino_audio_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.musicEnabled = parsed.musicEnabled ?? true;
                this.sfxEnabled = parsed.sfxEnabled ?? true;
                this.musicVolume = parsed.musicVolume ?? 0.3;
                this.sfxVolume = parsed.sfxVolume ?? 0.7;
                console.log('🎵 Configuración de audio cargada');
            }
        } catch (e) {
            console.warn('⚠️ Error cargando configuración de audio:', e);
        }
    }

    /**
     * Guarda la configuración en localStorage
     */
    saveSettings() {
        try {
            const settings = {
                musicEnabled: this.musicEnabled,
                sfxEnabled: this.sfxEnabled,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume
            };
            localStorage.setItem('domino_audio_settings', JSON.stringify(settings));
            console.log('💾 Configuración de audio guardada');
        } catch (e) {
            console.warn('⚠️ Error guardando configuración de audio:', e);
        }
    }

    /**
     * Reproduce un tono simple
     * @param {number} frequency - Frecuencia en Hz
     * @param {number} duration - Duración en segundos
     * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.sfxEnabled || !this.context) return;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            console.warn('⚠️ Error reproduciendo tono:', e);
        }
    }

    /**
     * Reproduce múltiples tonos simultáneamente (acorde)
     * @param {number[]} frequencies - Array de frecuencias
     * @param {number} duration - Duración en segundos
     * @param {string} type - Tipo de onda
     */
    playChord(frequencies, duration, type = 'sine') {
        if (!this.sfxEnabled || !this.context) return;

        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration, type);
            }, index * 50); // Pequeño delay para efecto de arpegio
        });
    }

    /**
     * Reproduce un efecto de sonido específico
     * @param {string} name - Nombre del efecto: 'click', 'place', 'draw', 'win', 'lose', 'pass'
     */
    playSFX(name) {
        if (!this.sfxEnabled || !this.context) return;

        switch (name) {
            case 'click':
            case 'button':
                this.playTone(1000, 0.05, 'sine');
                break;

            case 'place':
                // Sonido de colocar ficha
                this.playTone(800, 0.1, 'square');
                setTimeout(() => this.playTone(400, 0.05, 'square'), 50);
                break;

            case 'draw':
                // Sonido de robar ficha (deslizar)
                this.playTone(400, 0.15, 'sawtooth');
                break;

            case 'win':
                // Acorde mayor ascendente (victoria)
                this.playChord([523, 659, 784], 0.2, 'sine'); // Do-Mi-Sol
                break;

            case 'lose':
                // Acorde menor descendente (derrota)
                this.playChord([440, 349, 293], 0.2, 'sine'); // La-Fa-Re
                break;

            case 'pass':
                // Sonido de pasar turno
                this.playTone(250, 0.15, 'triangle');
                break;

            case 'blocked':
                // Sonido de juego bloqueado
                this.playTone(200, 0.3, 'sawtooth');
                break;

            case 'invalid':
                // Sonido de jugada inválida
                this.playTone(150, 0.1, 'square');
                setTimeout(() => this.playTone(100, 0.1, 'square'), 100);
                break;

            default:
                console.warn('⚠️ Efecto de sonido desconocido:', name);
        }
    }

    /**
     * Inicia la música de fondo
     */
    startMusic() {
        if (!this.musicEnabled || !this.context || this.isPlaying) return;

        try {
            // Crear osciladores para música ambiental
            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.context.destination);
            this.musicGain.gain.value = this.musicVolume;

            // Crear un tono base suave
            const oscillator1 = this.context.createOscillator();
            oscillator1.frequency.value = 220; // La
            oscillator1.type = 'sine';
            oscillator1.connect(this.musicGain);
            oscillator1.start();

            // Crear un tono armónico
            const oscillator2 = this.context.createOscillator();
            oscillator2.frequency.value = 330; // Mi
            oscillator2.type = 'sine';
            oscillator2.connect(this.musicGain);
            oscillator2.start();

            // Crear LFO para variación
            const lfo = this.context.createOscillator();
            const lfoGain = this.context.createGain();
            lfo.frequency.value = 0.5; // Variación lenta
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator1.frequency);
            lfo.start();

            this.musicSource = { oscillator1, oscillator2, lfo };
            this.isPlaying = true;

            console.log('🎵 Música iniciada');
        } catch (e) {
            console.warn('⚠️ Error iniciando música:', e);
        }
    }

    /**
     * Detiene la música de fondo
     */
    stopMusic() {
        if (!this.musicSource || !this.isPlaying) return;

        try {
            if (this.musicGain) {
                // Fade out
                this.musicGain.gain.exponentialRampToValueAtTime(
                    0.01,
                    this.context.currentTime + 0.5
                );
            }

            setTimeout(() => {
                if (this.musicSource) {
                    this.musicSource.oscillator1.stop();
                    this.musicSource.oscillator2.stop();
                    this.musicSource.lfo.stop();
                    this.musicSource = null;
                }
                this.isPlaying = false;
                console.log('🎵 Música detenida');
            }, 500);
        } catch (e) {
            console.warn('⚠️ Error deteniendo música:', e);
        }
    }

    /**
     * Alterna el estado de la música
     * @returns {boolean} Nuevo estado de la música
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }

        this.saveSettings();
        console.log('🎵 Música:', this.musicEnabled ? 'activada' : 'desactivada');
        return this.musicEnabled;
    }

    /**
     * Alterna el estado de los efectos de sonido
     * @returns {boolean} Nuevo estado de los efectos
     */
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        console.log('🔊 Efectos:', this.sfxEnabled ? 'activados' : 'desactivados');
        return this.sfxEnabled;
    }

    /**
     * Establece el volumen de la música
     * @param {number} volume - Volumen (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
        this.saveSettings();
    }

    /**
     * Establece el volumen de los efectos
     * @param {number} volume - Volumen (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    /**
     * Obtiene el estado actual del audio
     * @returns {Object} Estado del audio
     */
    getState() {
        return {
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isPlaying: this.isPlaying,
            contextState: this.context?.state
        };
    }

    /**
     * Resume el contexto de audio si está suspendido
     * (necesario en algunos navegadores al hacer clic)
     */
    async resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
                console.log('🎵 Audio Context resumido');
            } catch (e) {
                console.warn('⚠️ Error resumiendo Audio Context:', e);
            }
        }
    }
}

// Instancia singleton del AudioManager
let audioManagerInstance = null;

/**
 * Obtiene la instancia del AudioManager (singleton)
 * @returns {AudioManager} Instancia del audio manager
 */
export function getAudioManager() {
    if (!audioManagerInstance) {
        audioManagerInstance = new AudioManager();
    }
    return audioManagerInstance;
}

/**
 * Inicializa el audio manager y lo retorna
 * @returns {AudioManager} Instancia del audio manager
 */
export function initAudio() {
    const manager = getAudioManager();

    // Resumir contexto al hacer clic en cualquier parte
    document.addEventListener('click', () => {
        manager.resumeContext();
    }, { once: true });

    console.log('🎵 Sistema de audio inicializado');
    return manager;
}
