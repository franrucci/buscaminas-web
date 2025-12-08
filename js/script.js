document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var entradaNombre = document.getElementById('nombre-jugador');
    var errorNombre = document.getElementById('error-nombre-jugador');
    var selectorDificultad = document.getElementById('dificultad-juego');

    var textoEstado = document.getElementById('texto-estado');
    var textoResultado = document.getElementById('mensaje-final');

    var tablero = document.getElementById('tablero');
    var contadorMinas = document.getElementById('contador-minas');
    var contadorTiempo = document.getElementById('contador-tiempo');
    var btnCara = document.getElementById('boton-cara');

    var modal = document.getElementById('modal-mensaje');
    var modalTexto = document.getElementById('modal-texto');
    var modalCerrarBtn = document.getElementById('modal-cerrar');


    var estado = {
        nombreJugador: null,
        dificultad: 'facil',

        filas: 0,
        columnas: 0,
        minasTotales: 0,

        minasRestantes: 0,
        banderasColocadas: 0,

        casillasSegurasPorRevelar: 0,
        matriz: [], // matriz de celdas
        juegoTerminado: false,

        tiempo: 0,
        intervaloTiempo: null,
        temporizadorIniciado: false
    };


    selectorDificultad.value = 'facil';
    aplicarConfiguracionDificultad();

    selectorDificultad.onchange = manejarCambioDificultad;
    btnCara.onclick = manejarClickCara;

    modalCerrarBtn.onclick = cerrarModal;

    textoEstado.textContent = 'Ingresa tu nombre y pulsa la carita para comenzar.';

    iniciarNuevaPartida(false);

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
        aplicarConfiguracionDificultad();

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
        if (!texto) {
            return false;
        }
        var limpio = texto.trim();
        if (limpio.length < 3) {
            return false;
        }
        var patron = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; // Letras mayúsculas/minúsculas, acentos, Ñ/ñ, espacios
        return patron.test(limpio);
    }

    function descripcionDificultad(valor) {
        if (valor === 'facil') {
            return 'Fácil (8x8 – 10 minas)';
        }
        if (valor === 'media') {
            return 'Media (12x12 – 25 minas)';
        }
        if (valor === 'dificil') {
            return 'Difícil (16x16 – 40 minas)';
        }
        return valor;
    }

    // Construcción del tablero: crea la matriz lógica (estado.matriz) de objetos “celda”
    function construirMatrizVacia() {
        var f, c;
        for (f = 0; f < estado.filas; f = f + 1) { // Recorre todas las filas
            estado.matriz[f] = [];                    // Crea un array vacío para la fila f
            for (c = 0; c < estado.columnas; c = c + 1) { // Recorre todas las columnas
                estado.matriz[f][c] = {                // Crea el objeto celda en esa posición
                    fila: f,                             // Guarda índice de fila
                    columna: c,                          // Guarda índice de columna
                    tieneMina: false,                    // Por ahora no tiene mina
                    revelada: false,                     // Por ahora no fue revelada
                    marcada: false,                      // Por ahora no tiene bandera
                    minasAlrededor: 0,                   // Número de minas vecinas (se calcula después)
                    elemento: null                       // Referencia al div en el DOM (se asigna despues)
                };
            }
        }
    }

    function colocarMinasAleatorias() {
        var colocadas = 0;                                       // Contador de minas puestas
        while (colocadas < estado.minasTotales) {                // Mientras no haya puesto todas las minas
            var f = Math.floor(Math.random() * estado.filas);    // Fila aleatoria
            var c = Math.floor(Math.random() * estado.columnas); // Columna aleatoria
            var celda = estado.matriz[f][c];                     // Obtiene la celda seleccionada aleatoriamente

            if (!celda.tieneMina) {                              // Si esa celda NO tiene mina, coloca una
                celda.tieneMina = true;                          // Marca la celda como mina
                colocadas = colocadas + 1;                       // Suma una mina colocada
            }
        }
    }

    function calcularMinasAlrededor() {
        var f, c; // f: indice de fila | c: indice de columna
        var direcciones = [ // array con todos los movimientos posibles a las 8 casillas vecinas.
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        // recorre todas las posiciones (f, c) del tablero.
        for (f = 0; f < estado.filas; f = f + 1) {      // Recorre todas las filas
            for (c = 0; c < estado.columnas; c = c + 1) { // Recorre todas las columnas
                var celda = estado.matriz[f][c];

                if (celda.tieneMina) {              // Si la casilla ya tiene una mina
                    continue;                         // pasa a la siguiente celda del tablero.
                }

                var contador = 0;
                var i;
                for (i = 0; i < direcciones.length; i = i + 1) { // Recorre las 8 direcciones posibles
                    var df = direcciones[i][0];       // Desplazamiento en fila
                    var dc = direcciones[i][1];       // Desplazamiento en columna
                    var nf = f + df;                  // Fila vecina
                    var nc = c + dc;                  // Columna vecina

                    if (nf >= 0 && nf < estado.filas && nc >= 0 && nc < estado.columnas) {
                        if (estado.matriz[nf][nc].tieneMina) {
                            contador = contador + 1;
                        }
                    }
                }
                celda.minasAlrededor = contador;
            }
        }
    }

    function crearCeldasDOM() {
        var f, c;

        for (f = 0; f < estado.filas; f = f + 1) {   // Crea una fila visual por cada fila lógica
            var filaDiv = document.createElement('div');
            filaDiv.className = 'fila-tablero';

            for (c = 0; c < estado.columnas; c = c + 1) { // Recorre todas las columnas dentro de esa fila.
                var celdaLogica = estado.matriz[f][c];
                var divCelda = document.createElement('div');
                divCelda.className = 'celda';

                // Guardo coordenadas. Sirve para que, cuando el usuario haga click, se pueda saber que fila y columna es.
                divCelda.setAttribute('data-fila', String(f)); // Guarda coordenada de la fila.
                divCelda.setAttribute('data-columna', String(c)); // Guarda coordenada de la columna.

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

        if (estado.juegoTerminado) {
            return;
        }

        var celdaDiv = event.currentTarget;
        var fila = parseInt(celdaDiv.getAttribute('data-fila'), 10);
        var columna = parseInt(celdaDiv.getAttribute('data-columna'), 10);
        var celda = estado.matriz[fila][columna];

        if (celda.revelada || celda.marcada) {
            return;
        }

        if (!estado.temporizadorIniciado) {
            iniciarTemporizador();
        }

        revelarCelda(celda);
        verificarVictoria();
    }

    function manejarClickDerecho(event) {
        event.preventDefault();

        if (estado.juegoTerminado) {
            return false;
        }

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

        if (celda.revelada) {
            return false;
        }

        if (celda.marcada) {
            celda.marcada = false;
            celda.elemento.textContent = '';
            celda.elemento.className = 'celda';
            estado.banderasColocadas = estado.banderasColocadas - 1;
        } else {
            celda.marcada = true;
            celda.elemento.textContent = '🚩';
            celda.elemento.className = 'celda celda-bandera';
            estado.banderasColocadas = estado.banderasColocadas + 1;
        }

        actualizarContadorMinas();
        return false;
    }

    function revelarCelda(celda) {
        if (celda.revelada || celda.marcada) {
            return;
        }

        celda.revelada = true;
        celda.elemento.className = 'celda celda-revelada';

        if (celda.tieneMina) {
            celda.elemento.className = 'celda celda-revelada celda-mina';
            celda.elemento.textContent = '💣';
            finalizarPartida(false);
            return;
        }

        estado.casillasSegurasPorRevelar = estado.casillasSegurasPorRevelar - 1;

        if (celda.minasAlrededor > 0) {
            celda.elemento.textContent = String(celda.minasAlrededor);
            celda.elemento.className =
                'celda celda-revelada celda-n' + String(celda.minasAlrededor);
        } else {
            expandirDesde(celda);
        }
    }

    function expandirDesde(celdaInicial) {
        var pila = [celdaInicial];
        var direcciones = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], /*celda*/[0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        while (pila.length > 0) {
            var celda = pila.pop();
            var f = celda.fila;
            var c = celda.columna;
            var i;

            for (i = 0; i < direcciones.length; i = i + 1) {
                var df = direcciones[i][0];
                var dc = direcciones[i][1];
                var nf = f + df;
                var nc = c + dc;

                if (nf >= 0 && nf < estado.filas && nc >= 0 && nc < estado.columnas) {
                    var vecina = estado.matriz[nf][nc];

                    if (!vecina.revelada && !vecina.marcada && !vecina.tieneMina) {
                        vecina.revelada = true;
                        estado.casillasSegurasPorRevelar = estado.casillasSegurasPorRevelar - 1;

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
});