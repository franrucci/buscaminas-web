document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var form = document.getElementById('form-contacto');
    var inputNombre = document.getElementById('contacto-nombre');
    var inputEmail = document.getElementById('contacto-email');
    var inputMensaje = document.getElementById('contacto-mensaje');

    var errorNombre = document.getElementById('error-contacto-nombre');
    var errorEmail = document.getElementById('error-contacto-email');
    var errorMensaje = document.getElementById('error-contacto-mensaje');

    var textoEstado = document.getElementById('contacto-estado');

    form.addEventListener('submit', function (evento) {
        evento.preventDefault(); // no envia por defecto

        errorNombre.textContent = '';
        errorEmail.textContent = '';
        errorMensaje.textContent = '';
        textoEstado.textContent = '';

        var nombre = inputNombre.value.trim();
        var email = inputEmail.value.trim();
        var mensaje = inputMensaje.value.trim();

        var esValido = true;

        if (nombre.length < 3) {
            errorNombre.textContent = 'El nombre debe tener al menos 3 caracteres.';
            esValido = false;
        }

        var patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.length === 0) {
            errorEmail.textContent = 'El email no puede estar vacío.';
            esValido = false;
        } else if (!patronEmail.test(email)) {
            errorEmail.textContent = 'Ingresa un email válido.';
            esValido = false;
        }

        if (mensaje.length <= 5) {
            errorMensaje.textContent = 'El mensaje debe tener más de 5 caracteres.';
            esValido = false;
        }

        if (!esValido) {
            textoEstado.textContent = 'Por favor, corregí los errores antes de enviar.';
            return;
        }

        var destinatario = 'franrucci01@gmail.com';
        var asunto = 'Consulta desde el Buscaminas';
        var cuerpo = 'Nombre: ' + nombre + '\n' + 'Email: ' + email + '\n\n' + 'Mensaje:\n' + mensaje;

        var mailtoUrl = 'mailto:' + encodeURIComponent(destinatario) + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);

        textoEstado.textContent = 'Abriendo tu aplicación de correo...';

        window.location.href = mailtoUrl;
    });
});