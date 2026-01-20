/**
 * Sistema de confetti para celebraciones de victoria
 * Renderiza animación de confetti en canvas
 * @module Confetti
 */

/**
 * Configuración del confetti
 */
const confettiConfig = {
    particleCount: 150,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    gravity: 0.5,
    terminalVelocity: 8,
    drag: 0.075,
    duration: 5000
};

/**
 * Clase Partícula de confetti
 */
class ConfettiParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height - this.canvas.height;
        this.w = Math.random() * 10 + 5;
        this.h = Math.random() * 5 + 3;
        this.color = confettiConfig.colors[Math.floor(Math.random() * confettiConfig.colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.velocityY = Math.random() * 3 + 2;
        this.velocityX = Math.random() * 6 - 3;
        this.opacity = 1;
    }

    update() {
        // Aplicar gravedad
        this.velocityY += confettiConfig.gravity;

        // Limitar velocidad terminal
        if (this.velocityY > confettiConfig.terminalVelocity) {
            this.velocityY = confettiConfig.terminalVelocity;
        }

        // Aplicar drag (resistencia del aire)
        this.velocityX *= (1 - confettiConfig.drag);

        // Actualizar posición
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;

        // Reducir opacidad cuando está por salir de la pantalla
        if (this.y > this.canvas.height - 100) {
            this.opacity -= 0.02;
        }

        // Resetear si sale de la pantalla
        if (this.y > this.canvas.height || this.opacity <= 0) {
            return false;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

/**
 * Gestor de confetti
 */
class ConfettiManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
    }

    /**
     * Inicializa el canvas de confetti
     */
    init() {
        this.canvas = document.getElementById('confettiCanvas');
        if (!this.canvas) {
            console.warn('⚠️ Canvas de confetti no encontrado');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Resize listener
        window.addEventListener('resize', () => this.resize());

        console.log('🎊 Sistema de confetti inicializado');
        return true;
    }

    /**
     * Ajusta el canvas al tamaño de la ventana
     */
    resize() {
        if (!this.canvas) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Crea partículas de confetti
     */
    createParticles() {
        this.particles = [];
        for (let i = 0; i < confettiConfig.particleCount; i++) {
            this.particles.push(new ConfettiParticle(this.canvas));
        }
    }

    /**
     * Anima las partículas
     */
    animate() {
        if (!this.isActive || !this.ctx) return;

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Actualizar y dibujar partículas
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return particle.y < this.canvas.height && particle.opacity > 0;
        });

        // Continuar animación si hay partículas
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    /**
     * Inicia la animación de confetti
     * @param {number} duration - Duración opcional en ms
     */
    start(duration = confettiConfig.duration) {
        if (this.isActive) {
            this.stop();
        }

        this.isActive = true;
        this.createParticles();

        // Mostrar canvas
        this.canvas.classList.add('active');

        // Iniciar animación
        this.animate();

        // Auto-detener después de la duración
        setTimeout(() => {
            this.isActive = false;
        }, duration);

        console.log('🎊 Confetti iniciado');
    }

    /**
     * Detiene la animación de confetti
     */
    stop() {
        this.isActive = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Limpiar canvas y ocultar
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.canvas) {
            this.canvas.classList.remove('active');
        }

        this.particles = [];
        console.log('🎊 Confetti detenido');
    }

    /**
     * Burst de confetti (explosión corta)
     */
    burst() {
        const originalCount = confettiConfig.particleCount;
        confettiConfig.particleCount = 80;

        this.start(3000);

        // Restaurar configuración
        setTimeout(() => {
            confettiConfig.particleCount = originalCount;
        }, 100);
    }
}

// Instancia singleton
let confettiManagerInstance = null;

/**
 * Obtiene la instancia del ConfettiManager (singleton)
 * @returns {ConfettiManager} Instancia del confetti manager
 */
export function getConfettiManager() {
    if (!confettiManagerInstance) {
        confettiManagerInstance = new ConfettiManager();
    }
    return confettiManagerInstance;
}

/**
 * Inicializa el sistema de confetti
 * @returns {ConfettiManager} Instancia del confetti manager
 */
export function initConfetti() {
    const manager = getConfettiManager();
    manager.init();
    return manager;
}

/**
 * Lanza confetti (función de conveniencia)
 * @param {number} duration - Duración opcional
 */
export function launchConfetti(duration) {
    const manager = getConfettiManager();
    manager.start(duration);
}

/**
 * Burst de confetti (función de conveniencia)
 */
export function confettiBurst() {
    const manager = getConfettiManager();
    manager.burst();
}
