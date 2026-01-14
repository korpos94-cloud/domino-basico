const tablero = document.getElementById("tablero");

const ficha = document.createElement("div");
ficha.className = "ficha";

// Función para crear un punto en una posición concreta
function crearPunto(x, y) {
    const punto = document.createElement("div");
    punto.className = "punto";
    punto.style.left = x + "px";
    punto.style.top = y + "px";
    ficha.appendChild(punto);
}

// Dibujar una ficha 6-6 (tres puntos arriba, tres abajo)
crearPunto(15, 15);
crearPunto(30, 15);
crearPunto(45, 15);

crearPunto(15, 75);
crearPunto(30, 75);
crearPunto(45, 75);

tablero.appendChild(ficha);
