let catalogo = [];
let materiasInscritas = [];
const paletaColores = ['#d1e7dd', '#fff3cd', '#f8d7da', '#cff4fc', '#e2d9f3', '#ffe5d0', '#ffc107', '#20c997'];

// 1. Iniciar y Cargar Memoria Local
async function iniciarSistema() {
    try {
        const respuesta = await fetch('ofertas.json');
        catalogo = await respuesta.json();
        llenarBuscador();
        
        // Recuperar materias si recargaste la página (El LocalStorage)
        const memoria = localStorage.getItem('miHorarioUAGRM');
        if (memoria) {
            materiasInscritas = JSON.parse(memoria);
            renderizarHorario();
        }
    } catch (error) {
        console.error("Error crítico en base de datos:", error);
    }
}

// 2. Poblar el Buscador Inteligente
function llenarBuscador() {
    const datalist = document.getElementById('catalogo-list');
    datalist.innerHTML = ''; 
    catalogo.forEach(m => {
        let opcion = document.createElement('option');
        // Llave compuesta para evitar bugs de grupos
        opcion.value = `${m.sigla}-${m.grupo}`;
        opcion.text = `${m.materia} | Docente: ${m.docente}`;
        datalist.appendChild(opcion);
    });
}

// 3. Transformación Matemática de Tiempo
function horaAMinutos(horaTexto) {
    let partes = horaTexto.split(':');
    return parseInt(partes[0]) * 60 + parseInt(partes[1]);
}

// 4. Algoritmo de Detección de Colisiones
function hayChoque(nuevaMateria) {
    for (let inscrita of materiasInscritas) {
        for (let hNuevo of nuevaMateria.horarios) {
            for (let hInscrito of inscrita.horarios) {
                if (hNuevo.dia === hInscrito.dia) {
                    let inicioNuevo = horaAMinutos(hNuevo.inicio);
                    let finNuevo = horaAMinutos(hNuevo.fin);
                    let inicioInscrito = horaAMinutos(hInscrito.inicio);
                    let finInscrito = horaAMinutos(hInscrito.fin);

                    if (inicioNuevo < finInscrito && finNuevo > inicioInscrito) {
                        return `🚨 ALERTA: ${nuevaMateria.sigla} colisiona con ${inscrita.sigla} el día ${hNuevo.dia}.`;
                    }
                }
            }
        }
    }
    return null; 
}

// 5. Controlador de Interfaz: Inscribir Materia
function inscribirMateria() {
    const inputBuscador = document.getElementById('buscador-materias');
    const alerta = document.getElementById('alerta-choque');
    const llaveSeleccionada = inputBuscador.value; 
    
    // Buscar la materia exacta en el catálogo
    const materia = catalogo.find(m => `${m.sigla}-${m.grupo}` === llaveSeleccionada);

    if (!materia) {
        alerta.textContent = "Materia no encontrada. Selecciónala de la lista desplegable.";
        alerta.classList.remove('d-none');
        return;
    }

    // Evitar duplicados por sigla
    if (materiasInscritas.some(m => m.sigla === materia.sigla)) {
        alerta.textContent = `Error: Ya inscribiste un grupo de la materia ${materia.sigla}.`;
        alerta.classList.remove('d-none');
        return;
    }

    // Comprobar colisiones
    let mensajeError = hayChoque(materia);
    if (mensajeError) {
        alerta.textContent = mensajeError;
        alerta.classList.remove('d-none');
    } else {
        materiasInscritas.push(materia);
        localStorage.setItem('miHorarioUAGRM', JSON.stringify(materiasInscritas)); // Guardado automático
        alerta.classList.add('d-none');
        inputBuscador.value = ''; // Limpiar barra
        renderizarHorario();
    }
}

// 6. Eliminar Materia Individual
function eliminarMateria(siglaParaBorrar) {
    materiasInscritas = materiasInscritas.filter(m => m.sigla !== siglaParaBorrar);
    localStorage.setItem('miHorarioUAGRM', JSON.stringify(materiasInscritas));
    renderizarHorario();
}

// 7. Limpiar todo el horario
function limpiarTodo() {
    materiasInscritas = [];
    localStorage.removeItem('miHorarioUAGRM');
    renderizarHorario();
}

// 8. El Motor Visual Matricial (Pinta la Tabla)
function renderizarHorario() {
    // A. Limpiar la tabla
    const celdas = document.querySelectorAll('td[id]');
    celdas.forEach(celda => {
        celda.innerHTML = ''; 
        celda.style.backgroundColor = ''; 
        celda.className = ''; 
    });

    // B. Pintar las materias
    materiasInscritas.forEach((materia, index) => {
        let colorFondo = paletaColores[index % paletaColores.length];

        materia.horarios.forEach(horario => {
            let coordenadaId = `${horario.dia}-${horario.inicio}`;
            let celdaDestino = document.getElementById(coordenadaId);

            if (celdaDestino) {
                // Inyecta Sigla, Grupo, Nombre de Materia y el Botón de eliminar
                celdaDestino.innerHTML = `
                    <div class="position-relative p-1">
                        <span class="fw-bold d-block">${materia.sigla}</span>
                        <small class="text-dark fw-bold">-${materia.grupo}-</small><br>
                        <span class="d-block text-muted mt-1" style="font-size: 0.65rem; line-height: 1;">${materia.materia}</span>
                        <button class="btn btn-sm btn-danger position-absolute top-0 end-0 py-0 px-1" 
                                style="font-size: 0.6rem; margin-top:-2px;" 
                                onclick="eliminarMateria('${materia.sigla}')">&times;</button>
                    </div>`;
                celdaDestino.style.backgroundColor = colorFondo;
                celdaDestino.className = 'align-middle border border-secondary border-opacity-25';
            }
        });
    });

    // C. Sincronizar la boleta inferior
    renderizarBoleta();
}

// 9. El Generador de Boletas (Lista Oficial Inferior)
function renderizarBoleta() {
    const lista = document.getElementById('lista-boleta');
    lista.innerHTML = '';
    
    if (materiasInscritas.length === 0) {
        lista.innerHTML = '<li class="list-group-item text-muted text-center py-3">Tu boleta está vacía. Agrega materias arriba.</li>';
        return;
    }

    materiasInscritas.forEach(m => {
        let li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-start";
        li.innerHTML = `
            <div class="ms-2 me-auto">
                <div class="fw-bold text-primary">${m.sigla} - ${m.materia} <span class="badge bg-secondary ms-2">Grupo ${m.grupo}</span></div>
                <small class="text-dark fw-bold">👨‍🏫 Docente: <span class="fw-normal text-muted">${m.docente}</span></small>
            </div>
            <button class="btn btn-outline-danger btn-sm mt-1" onclick="eliminarMateria('${m.sigla}')">Quitar</button>
        `;
        lista.appendChild(li);
    });
}

// Arrancar el motor
iniciarSistema();