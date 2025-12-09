'use strict';

// VARIABLES DEL DOM (GLOBALES)
var entradaNombre;
var errorNombre;
var selectorDificultad;
var textoEstado;
var textoResultado;
var tablero;
var contadorMinas;
var contadorTiempo;
var btnCara;
var modal;
var modalTexto;
var modalCerrarBtn;


// ESTADO DEL JUEGO (GLOBAL)
var estado = {
    nombreJugador: null,
    dificultad: 'facil',

    filas: 0,
    columnas: 0,
    minasTotales: 0,

    minasRestantes: 0,
    banderasColocadas: 0,

    casillasSegurasPorRevelar: 0,
    matriz: [],
    juegoTerminado: false,

    tiempo: 0,
    intervaloTiempo: null,
    temporizadorIniciado: false
};

// FUNCIONES PRINCIPALES
function manejarCambioDificultad() {
    estado.dificultad = selectorDificultad.value;
    aplicarConfiguracionDificultad();
    iniciarNuevaPartida(false);
}

function manejarClickCara() {
    var nombreInput = entradaNombre.value;

    if (!nombreEsValido(nombreInput)) {
        estado.nombreJugador = null;
        errorNombre.textContent = 'El nombre debe tener al menos 3 letras y solo letras/espacios.';
        mostrarModal('Por favor ingresa un nombre válido para comenzar a jugar.');
        return;
    }

    estado.nombreJugador = nombreInput.trim();
    errorNombre.textContent = '';
    iniciarNuevaPartida(true);
}

function iniciarNuevaPartida(mostrarMensaje) {
    var totalCasillas = estado.filas * estado.columnas;

    estado.matriz = [];
    estado.banderasColocadas = 0;
    estado.minasRestantes = estado.minasTotales;
    estado.casillasSegurasPorRevelar = totalCasillas - estado.minasTotales;
    estado.juegoTerminado = false;

    detenerTemporizador();
    estado.tiempo = 0;
    estado.temporizadorIniciado = false;
    contadorTiempo.textContent = formatearTresDigitos(0);
    contadorMinas.textContent = formatearTresDigitos(estado.minasRestantes);
    textoResultado.textContent = '';
    btnCara.textContent = '🙂';

    if (mostrarMensaje && estado.nombreJugador) {
        textoEstado.textContent = 'Jugador: ' + estado.nombreJugador + ' | Dificultad: ' + descripcionDificultad(estado.dificultad) + '. Revela una casilla para comenzar el tiempo.';
    } else {
        textoEstado.textContent = 'Ingresa tu nombre y pulsa la carita para comenzar.';
    }

    tablero.innerHTML = '';

    construirMatrizVacia();
    colocarMinasAleatorias();
    calcularMinasAlrededor();
    crearCeldasDOM();
}

function aplicarConfiguracionDificultad() {
    var valor = selectorDificultad.value;

    estado.dificultad = valor;

    if (valor === 'facil') {
        estado.filas = 8;
        estado.columnas = 8;
        estado.minasTotales = 10;
    } else if (valor === 'media') {
        estado.filas = 12;
        estado.columnas = 12;
        estado.minasTotales = 25;
    } else if (valor === 'dificil') {
        estado.filas = 16;
        estado.columnas = 16;
        estado.minasTotales = 40;
    } else {
        estado.filas = 8;
        estado.columnas = 8;
        estado.minasTotales = 10;
    }
}

function nombreEsValido(texto) {
    if (!texto) return false;
    var limpio = texto.trim();
    if (limpio.length < 3) return false;
    var patron = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return patron.test(limpio);
}

function descripcionDificultad(valor) {
    if (valor === 'facil') return 'Fácil (8x8 – 10 minas)';
    if (valor === 'media') return 'Media (12x12 – 25 minas)';
    if (valor === 'dificil') return 'Difícil (16x16 – 40 minas)';
    return valor;
}

function construirMatrizVacia() {
    var f, c;
    for (f = 0; f < estado.filas; f++) {
        estado.matriz[f] = [];
        for (c = 0; c < estado.columnas; c++) {
            estado.matriz[f][c] = {
                fila: f,
                columna: c,
                tieneMina: false,
                revelada: false,
                marcada: false,
                minasAlrededor: 0,
                elemento: null
            };
        }
    }
}

function colocarMinasAleatorias() {
    var colocadas = 0;
    while (colocadas < estado.minasTotales) {
        var f = Math.floor(Math.random() * estado.filas);
        var c = Math.floor(Math.random() * estado.columnas);
        var celda = estado.matriz[f][c];

        if (!celda.tieneMina) {
            celda.tieneMina = true;
            colocadas++;
        }
    }
}

function calcularMinasAlrededor() {
    var f, c;
    var direcciones = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (f = 0; f < estado.filas; f++) {
        for (c = 0; c < estado.columnas; c++) {
            var celda = estado.matriz[f][c];

            if (celda.tieneMina) continue;

            var contador = 0;
            var i;
            for (i = 0; i < direcciones.length; i++) {
                var df = direcciones[i][0];
                var dc = direcciones[i][1];
                var nf = f + df;
                var nc = c + dc;

                if (nf >= 0 && nf < estado.filas && nc >= 0 && nc < estado.columnas) {
                    if (estado.matriz[nf][nc].tieneMina) contador++;
                }
            }
            celda.minasAlrededor = contador;
        }
    }
}

function crearCeldasDOM() {
    var f, c;

    for (f = 0; f < estado.filas; f++) {
        var filaDiv = document.createElement('div');
        filaDiv.className = 'fila-tablero';

        for (c = 0; c < estado.columnas; c++) {
            var celdaLogica = estado.matriz[f][c];
            var divCelda = document.createElement('div');
            divCelda.className = 'celda';

            divCelda.setAttribute('data-fila', String(f));
            divCelda.setAttribute('data-columna', String(c));

            divCelda.onclick = manejarClickIzquierdo;
            divCelda.oncontextmenu = manejarClickDerecho;

            celdaLogica.elemento = divCelda;
            filaDiv.appendChild(divCelda);
        }

        tablero.appendChild(filaDiv);
    }
}

function manejarClickIzquierdo(event) {
    var nombreInput = entradaNombre.value;

    if (!nombreEsValido(nombreInput)) {
        estado.nombreJugador = null;
        errorNombre.textContent = 'El nombre debe tener al menos 3 letras y solo letras/espacios.';
        mostrarModal('Ingresa un nombre válido para comenzar a jugar.');
        return;
    }

    if (estado.nombreJugador === null || estado.nombreJugador !== nombreInput.trim()) {
        estado.nombreJugador = nombreInput.trim();
        errorNombre.textContent = '';
        textoEstado.textContent = 'Jugador: ' + estado.nombreJugador + ' | Dificultad: ' + descripcionDificultad(estado.dificultad) + '. Revela una casilla para continuar.';
    }

    if (estado.juegoTerminado) return;

    var celdaDiv = event.currentTarget;
    var fila = parseInt(celdaDiv.getAttribute('data-fila'), 10);
    var columna = parseInt(celdaDiv.getAttribute('data-columna'), 10);
    var celda = estado.matriz[fila][columna];

    if (celda.revelada || celda.marcada) return;

    if (!estado.temporizadorIniciado) iniciarTemporizador();

    revelarCelda(celda);
    verificarVictoria();
}

function manejarClickDerecho(event) {
    event.preventDefault();

    if (estado.juegoTerminado) return false;

    if (!nombreEsValido(entradaNombre.value)) {
        estado.nombreJugador = null;
        errorNombre.textContent = 'El nombre debe tener al menos 3 letras y solo letras/espacios.';
        mostrarModal('Ingresa un nombre válido para comenzar a jugar.');
        return false;
    }

    var celdaDiv = event.currentTarget;
    var fila = parseInt(celdaDiv.getAttribute('data-fila'), 10);
    var columna = parseInt(celdaDiv.getAttribute('data-columna'), 10);
    var celda = estado.matriz[fila][columna];

    if (celda.revelada) return false;

    if (celda.marcada) {
        celda.marcada = false;
        celda.elemento.textContent = '';
        celda.elemento.className = 'celda';
        estado.banderasColocadas--;
    } else {
        celda.marcada = true;
        celda.elemento.textContent = '🚩';
        celda.elemento.className = 'celda celda-bandera';
        estado.banderasColocadas++;
    }

    actualizarContadorMinas();
    return false;
}

function revelarCelda(celda) {
    if (celda.revelada || celda.marcada) return;

    celda.revelada = true;
    celda.elemento.className = 'celda celda-revelada';

    if (celda.tieneMina) {
        celda.elemento.className = 'celda celda-revelada celda-mina';
        celda.elemento.textContent = '💣';
        finalizarPartida(false);
        return;
    }

    estado.casillasSegurasPorRevelar--;

    if (celda.minasAlrededor > 0) {
        celda.elemento.textContent = String(celda.minasAlrededor);
        celda.elemento.className = 'celda celda-revelada celda-n' + String(celda.minasAlrededor);
    } else {
        expandirDesde(celda);
    }
}

function expandirDesde(celdaInicial) {
    var pila = [celdaInicial];
    var direcciones = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    while (pila.length > 0) {
        var celda = pila.pop();
        var f = celda.fila;
        var c = celda.columna;

        var i;
        for (i = 0; i < direcciones.length; i++) {
            var df = direcciones[i][0];
            var dc = direcciones[i][1];
            var nf = f + df;
            var nc = c + dc;

            if (nf >= 0 && nf < estado.filas && nc >= 0 && nc < estado.columnas) {
                var vecina = estado.matriz[nf][nc];

                if (!vecina.revelada && !vecina.marcada && !vecina.tieneMina) {
                    vecina.revelada = true;
                    estado.casillasSegurasPorRevelar--;

                    if (vecina.minasAlrededor > 0) {
                        vecina.elemento.textContent = String(vecina.minasAlrededor);
                        vecina.elemento.className = 'celda celda-revelada celda-n' + String(vecina.minasAlrededor);
                    } else {
                        vecina.elemento.className = 'celda celda-revelada';
                        pila.push(vecina);
                    }
                }
            }
        }
    }
}

function verificarVictoria() {
    if (estado.casillasSegurasPorRevelar === 0) {
        finalizarPartida(true);
    }
}

function actualizarContadorMinas() {
    estado.minasRestantes = estado.minasTotales - estado.banderasColocadas;
    contadorMinas.textContent = formatearTresDigitos(estado.minasRestantes);
}

function finalizarPartida(gano) {
    estado.juegoTerminado = true;
    detenerTemporizador();

    var f, c;
    for (f = 0; f < estado.filas; f++) {
        for (c = 0; c < estado.columnas; c++) {
            var celda = estado.matriz[f][c];

            if (celda.tieneMina && !celda.revelada) {
                celda.elemento.className = 'celda celda-revelada celda-mina';
                celda.elemento.textContent = '💣';
            }
        }
    }

    if (gano) {
        btnCara.textContent = '😎';
        textoResultado.textContent = '¡Ganaste! Felicitaciones.';
        mostrarModal('¡Ganaste, ' + estado.nombreJugador + '! Tiempo: ' + estado.tiempo + ' segundos.');
    } else {
        btnCara.textContent = '😵';
        textoResultado.textContent = 'Perdiste. Tocaste una mina.';
        mostrarModal('Perdiste, ' + (estado.nombreJugador || 'jugador') + '. Tocaste una mina.');
    }
}

function iniciarTemporizador() {
    estado.temporizadorIniciado = true;
    estado.tiempo = 0;
    contadorTiempo.textContent = formatearTresDigitos(0);

    estado.intervaloTiempo = setInterval(function () {
        estado.tiempo++;
        contadorTiempo.textContent = formatearTresDigitos(estado.tiempo);
    }, 1000);
}

function detenerTemporizador() {
    if (estado.intervaloTiempo !== null) {
        clearInterval(estado.intervaloTiempo);
    }
}

function mostrarModal(mensaje) {
    modalTexto.textContent = mensaje;
    modal.style.display = 'flex';
}

function cerrarModal() {
    modal.style.display = 'none';
}

function formatearTresDigitos(numero) {
    var n = Number(numero);
    if (isNaN(n)) n = 0;
    n = Math.max(-999, Math.min(999, n));
    var texto = n < 0 ? '-0' + Math.abs(n) : '000' + n;
    return texto.slice(-3);
}

// ===============================
// INICIALIZACIÓN
// ===============================
function inicializarJuego() {
    entradaNombre = document.getElementById('nombre-jugador');
    errorNombre = document.getElementById('error-nombre-jugador');
    selectorDificultad = document.getElementById('dificultad-juego');
    textoEstado = document.getElementById('texto-estado');
    textoResultado = document.getElementById('mensaje-final');
    tablero = document.getElementById('tablero');
    contadorMinas = document.getElementById('contador-minas');
    contadorTiempo = document.getElementById('contador-tiempo');
    btnCara = document.getElementById('boton-cara');
    modal = document.getElementById('modal-mensaje');
    modalTexto = document.getElementById('modal-texto');
    modalCerrarBtn = document.getElementById('modal-cerrar');

    selectorDificultad.value = 'facil';
    aplicarConfiguracionDificultad();

    selectorDificultad.onchange = manejarCambioDificultad;
    btnCara.onclick = manejarClickCara;
    modalCerrarBtn.onclick = cerrarModal;

    textoEstado.textContent = 'Ingresa tu nombre y pulsa la carita para comenzar.';

    iniciarNuevaPartida(false);
}

document.addEventListener('DOMContentLoaded', inicializarJuego);