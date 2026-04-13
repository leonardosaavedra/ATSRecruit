const API_URL = "https://script.google.com/macros/s/AKfycbzNKVR8TjuhinSO2Upv00eOCaIZPS4pVR8hM528fXVmwnOlA5jZX4Nejshx4MigwilG/exec";
let vacantesData = [];

// Formateador de moneda
const fmtMoney = (n) => parseFloat(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) + " por mes";

function generarListaHTML(texto) {
    if (!texto || texto.trim() === "" || texto.includes("No especificado")) {
        return "<ul><li>No especificado</li></ul>";
    }
    const elementos = texto.replace(/\[BR\]/g, ',').split(',');
    const listaLi = elementos
        .map(item => item.trim())
        .filter(item => item !== "")
        .map(item => `<li>${item}</li>`)
        .join('');
    return `<ul class="job-list-bullets">${listaLi}</ul>`;
}

async function cargar() {
    try {
        const r = await fetch(API_URL);
        vacantesData = await r.json();
        renderList();
    } catch(e) { console.error("Error cargando datos:", e); }
}

function renderList() {
    const list = document.getElementById('listaVacantes');
    list.innerHTML = `<h5 class="fw-bold mb-4">Empleos para ti</h5>`;
    vacantesData.forEach(v => {
        const card = document.createElement('div');
        card.className = `job-card ${v.Solicitud_Eliminacion === 'Pendiente' ? 'pending-delete' : ''}`;
        card.id = `card-${v.ID_Vacante}`;
        card.onclick = () => ver(v.ID_Vacante);
        card.innerHTML = `
            <h6>${v.Titulo}</h6>
            <div class="meta"><i class="fa-solid fa-location-dot me-1"></i>${v.Ubicacion}</div>
            <div class="meta text-success fw-bold mt-1">${fmtMoney(v.Salario)}</div>
        `;
        list.appendChild(card);
    });
}

function ver(id) {
    const v = vacantesData.find(x => x.ID_Vacante == id);
    if(!v) return;

    // UI Reset
    document.querySelectorAll('.job-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`card-${id}`).classList.add('active');
    document.getElementById('vacio').classList.add('d-none');
    document.getElementById('detalleInfo').classList.remove('d-none');

    // Separar Jornada y Horario
    const infoJornada = v.Tipo_Jornada.split('|');
    const jornadaTexto = infoJornada[0] ? infoJornada[0].trim() : v.Tipo_Jornada;
    const horarioTexto = infoJornada[1] ? infoJornada[1].trim() : "Horario no especificado";

    document.getElementById('txtTitulo').innerText = v.Titulo;
    
    document.getElementById('txtIconos').innerHTML = `
        <div class="detail-icon-item">
            <i class="fa-solid fa-money-bill-1"></i> 
            <span><b>${fmtMoney(v.Salario)}</b></span>
        </div>
        <div class="detail-icon-item">
            <i class="fa-solid fa-location-dot"></i> 
            <span>${v.Ubicacion}</span>
        </div>
        <div class="detail-icon-item">
            <i class="fa-solid fa-briefcase"></i> 
            <span>${jornadaTexto}</span>
        </div>
        <div class="detail-icon-item">
            <i class="fa-solid fa-calendar-day"></i> 
            <span>${horarioTexto}</span>
        </div>
    `;

    document.getElementById('txtDescripcion').innerText = v.Descripcion.replace(/\[BR\]/g, '\n');
    document.getElementById('txtRequisitos').innerHTML = generarListaHTML(v.Requisitos);
    document.getElementById('txtBeneficios').innerHTML = generarListaHTML(v.Beneficios);
    
    // Guardar el ID en el input oculto del formulario
    document.getElementById('inputID').value = v.ID_Vacante;
}

// CORRECCIÓN: Función para abrir el Modal
function abrirForm() { 
    const myModal = new bootstrap.Modal(document.getElementById('modalPostulacion'));
    myModal.show();
}

async function solicitarBajaAccion() {
    const id = document.getElementById('inputID').value;
    if(!id) return alert("Selecciona una vacante primero");
    const pass = prompt("Clave de seguridad:");
    if(pass === "241086") {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: "solicitarBaja", id_vacante: id, pass: "241086" })
        });
        alert("Solicitud enviada al administrador.");
        cargar();
    }
}

// Lógica de postulación corregida para el Modal
document.getElementById('formPostulacion').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const textoOriginal = btn.innerText;

    btn.disabled = true;
    btn.innerText = "Enviando...";

    const data = Object.fromEntries(new FormData(e.target));
    data.action = "registrar"; 

    try {
        await fetch(API_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify(data) 
        });

        alert("¡Postulación enviada con éxito!");
        e.target.reset();
        
        // Cerrar Modal
        const modalEl = document.getElementById('modalPostulacion');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

    } catch (error) {
        console.error(error);
        alert("Error al enviar.");
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
};




// Lógica para mostrar/ocultar campos dinámicos
document.addEventListener('change', (e) => {
    // Manejo de Discapacidad
    if (e.target.id === 'selectDiscapacidad') {
        const wrapper = document.getElementById('wrapperDiscapacidad');
        if (e.target.value === 'Si') {
            wrapper.classList.remove('d-none');
        } else {
            wrapper.classList.add('d-none');
        }
    }

    // Manejo de "Actualmente laborando"
    if (e.target.id === 'checkSigueAqui') {
        const camposSalida = document.getElementById('camposSalida');
        if (e.target.checked) {
            camposSalida.classList.add('d-none');
        } else {
            camposSalida.classList.remove('d-none');
        }
    }
});

window.onload = cargar;