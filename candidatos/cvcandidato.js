import { auth, db, ref, get, onValue, onAuthStateChanged, signOut, update } from '../js/config.js';

const DEFAULT_PHOTO = 'https://via.placeholder.com/150';

/* ==========================================
   CARGA INICIAL Y CONFIGURACIÓN
========================================== */
const cargarAnios = () => {
    const anioActual = new Date().getFullYear();
    document.querySelectorAll('.select-anio').forEach(select => {
        for (let i = anioActual; i >= 1970; i--) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = i;
            select.appendChild(opt);
        }
    });
};
cargarAnios();

/* ==========================================
   AUTOCOMPLETADO POR CP (JSON LOCAL)
========================================== */
const setupCPAutocomplete = () => {

    let cpData = {};

    fetch('./cp_optimizado.json')
        .then(res => res.json())
        .then(data => {
            cpData = data;
            console.log("✅ CP cargados");
        })
        .catch(err => console.error("Error cargando JSON:", err));

    document.addEventListener("input", (e) => {

        if (e.target && e.target.id === "cp") {

            const cp = e.target.value.trim();
            const selectColonia = document.getElementById("colonia");
            const inputEstado = document.getElementById("estado");
            const inputMunicipio = document.getElementById("municipio");

            if (!Object.keys(cpData).length) return;

            if (cp.length < 5) {
                if (inputEstado) inputEstado.value = "";
                if (inputMunicipio) inputMunicipio.value = "";
                if (selectColonia) selectColonia.innerHTML = '<option value="">Selecciona colonia</option>';
                return;
            }

            if (cp.length === 5 && !isNaN(cp)) {

                const info = cpData[cp];

                if (!info) {
                    if (inputEstado) inputEstado.value = "";
                    if (inputMunicipio) inputMunicipio.value = "";
                    if (selectColonia) selectColonia.innerHTML = '<option value="">CP no encontrado</option>';
                    return;
                }

                if (inputEstado) inputEstado.value = info.estado;
                if (inputMunicipio) inputMunicipio.value = info.municipio;

                if (selectColonia) {
                    selectColonia.innerHTML = '<option value="">Selecciona una colonia</option>';
                    info.colonias.forEach(col => {
                        const option = document.createElement("option");
                        option.value = col;
                        option.textContent = col;
                        selectColonia.appendChild(option);
                    });
                }
            }
        }
    });
};

setupCPAutocomplete();

/* ==========================================
   AUTENTICACIÓN Y RENDERIZADO
========================================== */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            renderCandidato(data, user);
            fillModals(data, user);
            cargarPostulaciones(user.uid);
        }

        const userNameNav = document.getElementById('userNameNav');
        const userImgNav = document.getElementById('userImgNav');

        if (userNameNav) userNameNav.innerText = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';
        if (userImgNav) userImgNav.src = user.photoURL || DEFAULT_PHOTO;
    } else {
        window.location.href = '../index.html';
    }
});

/* ==========================================
   RENDER
========================================== */
function renderCandidato(data, user) {

    document.getElementById('lblFoto').src = data.foto || user.photoURL || DEFAULT_PHOTO;
    document.getElementById('lblNombreMain').innerText = `${data.nombre || ''} ${data.apellido || ''}`;
    document.getElementById('lblPuestoPrincipal').innerText = data.exp_puesto1 || 'Postulante';

    Object.keys(data).forEach(key => {
        const el = document.getElementById(`lbl${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (el) el.innerText = data[key] || '-';
    });

    // Ubicación
    document.getElementById('lbldireccion').innerText = data.direccion || '-';
    document.getElementById('lblColonia').innerText = data.colonia || '-';
    document.getElementById('lblMunicipioEstado').innerText =
        [data.municipio, data.estado].filter(Boolean).join(', ') || '-';

    document.getElementById('lblCorreo').innerText = data.correo || user.email;

    const elFinTexto = document.getElementById('lblExp_fin_texto');
    if (elFinTexto) {
        elFinTexto.innerText = data.actualmente_laborando
            ? 'Presente'
            : `${data.mes_out || ''} ${data.anio_out || ''}`;
    }
}

/* ==========================================
   LLENAR MODALES
========================================== */
function fillModals(data, user) {

    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            if (input.type === 'checkbox') input.checked = data[key];
            else input.value = data[key];
        }
    });

    // 🔥 EDUCACIÓN (parsear "AGOSTO 2015")
    if (data.edu_inicio) {
        const [mes, anio] = data.edu_inicio.split(' ');
        const mesEl = document.getElementById('edu_inicio_mes');
        const anioEl = document.getElementById('edu_inicio_anio');

        if (mesEl) mesEl.value = mes;
        if (anioEl) anioEl.value = anio;
    }

    if (data.edu_fin) {
        const [mes, anio] = data.edu_fin.split(' ');
        const mesEl = document.getElementById('edu_fin_mes');
        const anioEl = document.getElementById('edu_fin_anio');

        if (mesEl) mesEl.value = mes;
        if (anioEl) anioEl.value = anio;
    }

    const emailReadonly = document.getElementById('email_readonly');
    if (emailReadonly) emailReadonly.value = data.correo || user.email;
}

/* ==========================================
   GUARDADO
========================================== */
document.addEventListener('click', async (e) => {

    if (e.target && e.target.classList.contains('btn-save')) {

        const btn = e.target;
        const modalId = btn.getAttribute('data-modal');
        const modalEl = document.getElementById(modalId);
        const inputs = modalEl.querySelectorAll('input, select, textarea');
        const user = auth.currentUser;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        let updates = {};

inputs.forEach(input => {

    // ❌ CAMPOS QUE NO SE DEBEN GUARDAR
    const excluir = [
        "edu_inicio_mes",
        "edu_inicio_anio",
        "edu_fin_mes",
        "edu_fin_anio"
    ];

    if (
        input.id &&
        input.id !== 'email_readonly' &&
        !excluir.includes(input.id)
    ) {
        updates[input.id] = input.type === 'checkbox'
            ? input.checked
            : input.value;
    }
});

        /* 🔥 FORMATEAR EDUCACIÓN */
if (modalId === "modalEducacion") {

    const mesInicio = document.getElementById("edu_inicio_mes")?.value;
    const anioInicio = document.getElementById("edu_inicio_anio")?.value;

    const mesFin = document.getElementById("edu_fin_mes")?.value;
    const anioFin = document.getElementById("edu_fin_anio")?.value;

    updates.edu_inicio = (mesInicio && anioInicio)
        ? `${mesInicio} ${anioInicio}`
        : '';

    updates.edu_fin = (mesFin && anioFin)
        ? `${mesFin} ${anioFin}`
        : '';
}

        try {
            const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
            await update(userRef, updates);

            bootstrap.Modal.getInstance(modalEl)?.hide();
            location.reload();

        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
            btn.disabled = false;
            btn.innerText = "Reintentar";
        }
    }
});

/* ==========================================
    CARGAR POSTULACIONES DEL CANDIDATO
========================================== */

async function cargarPostulaciones(uid) {

    const contenedor = document.getElementById("misPostulaciones");
    const postulacionesRef = ref(db, "postulaciones");

    onValue(postulacionesRef, async (snapshot) => {

        const data = snapshot.val();

        if (!data) {
            contenedor.innerHTML = `<p class="text-muted small">No tienes postulaciones</p>`;
            return;
        }

        const postulaciones = Object.values(data)
            .filter(p => p.uid_candidato === uid);

        if (postulaciones.length === 0) {
            contenedor.innerHTML = `<p class="text-muted small">Aún no te has postulado</p>`;
            return;
        }

        contenedor.innerHTML = "";

        for (let p of postulaciones) {

            const estado = p.estado_proceso || "Pendiente";
            const color = getColorEstado(estado);

            let titulo = "Vacante";
            let empresa = "";

            // 🔥 TRAER VACANTE REAL
            if (p.id_vacante) {
                const vacRef = ref(db, `vacantes/${p.id_vacante}`);
                const snapVac = await get(vacRef);

                if (snapVac.exists()) {
                    const v = snapVac.val();
                    titulo = v.titulo || "Vacante";
                    empresa = v.empresa || "";
                }
            }

            contenedor.innerHTML += `
                <div class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center"
                    style="cursor:pointer"
                    onclick="verVacante('${p.id_vacante}', '${p.estado_proceso}')">

                    <div>
                        <div class="fw-bold small">${titulo}</div>
                        <small class="text-muted">${empresa}</small>
                    </div>

                    <span class="badge bg-${color}">${estado}</span>
                </div>
            `;
        }

    });
}

/* ==========================================
    FUNCION PARA ASIGNAR COLOR SEGÚN ESTADO
========================================== */

function getColorEstado(estado) {
    switch (estado) {
        case "Interesado": return "success";
        case "Descartado": return "danger";
        case "En revisión": return "warning";
        default: return "secondary";
    }
}

/* ==========================================
    FUNCION PARA GENERAR TIMELINE DE PROCESO
========================================== */

function generarTimeline(estadoActual) {

    // 🔴 MANEJO ESPECIAL PARA DESCARTADO
    if (estadoActual === "Descartado") {
        return `
            <div class="alert alert-danger small mt-3">
                <i class="bi bi-x-circle me-2"></i>
                Tu postulación no continuó en este proceso. ¡Sigue intentando!
            </div>
        `;
    }

    const pasos = [
        "Postulado",
        "En revisión",
        "Interesado",
        "Entrevista",
        "Contratado"
    ];

    let html = `<div class="timeline-horizontal mt-3 mb-3">`;

    pasos.forEach((paso) => {

        let clase = "pending";

        if (paso === estadoActual) {
            clase = "active";
        } else if (pasos.indexOf(paso) < pasos.indexOf(estadoActual)) {
            clase = "done";
        }

        html += `
            <div class="timeline-step ${clase}">
                <div class="dot"></div>
                <div class="label">${paso}</div>
            </div>
        `;
    });

    html += `</div>`;

    return html;
}


/* ==========================================
   SLIDER DE TABS (FINAL FIX)
========================================== */

function moveSlider() {
    const activeTab = document.querySelector('.nav-tabs-custom .nav-link.active');
    const slider = document.querySelector('.tab-slider');
    const container = document.querySelector('.nav-tabs-custom');

    if (!activeTab || !slider || !container) return;

    const rect = activeTab.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    slider.style.width = rect.width + "px";
    slider.style.left = (rect.left - parentRect.left) + "px";
}

// 🔥 Ejecutar cuando TODO esté listo (incluyendo Bootstrap)
window.addEventListener('load', () => {
    moveSlider();
});

// 🔥 Evento correcto de Bootstrap
document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', () => {
        moveSlider();
    });
});

// 🔥 Resize
window.addEventListener('resize', moveSlider);

const btnCerrar = document.getElementById('btnCerrarSesion');
if (btnCerrar) btnCerrar.onclick = () => signOut(auth);


// 🔥 AQUÍ MISMO AGREGA ESTO
window.verVacante = async (idVacante, estado) => {

    const vacanteRef = ref(db, `vacantes/${idVacante}`);
    const snapshot = await get(vacanteRef);

    if (!snapshot.exists()) return;

    const v = snapshot.val();

    // 🔥 TÍTULO
    document.getElementById("tituloVacanteModal").innerHTML = `
        ${v.titulo || "Vacante"}
        <div class="vacante-ubicacion">${v.ubicacion || ""}</div>
    `;

    // 🔥 ESTATUS DINÁMICO
    const colorEstado = getColorEstado(estado);

    // 🔥 CONTENIDO
    document.getElementById("descripcionVacante").innerHTML = `
    
    <div class="estado-container">
    <span class="badge estado-badge bg-${colorEstado}">
        ${estado || "Pendiente"}
    </span>
</div>

    ${generarTimeline(estado)}

    <hr>

    <div><strong>Horario:</strong> ${v.horario || "-"}</div>
    <div><strong>Jornada:</strong> ${v.jornada || "-"}</div>
    <div><strong>Salario:</strong> $${v.salarioDesde || "0"} - $${v.salarioHasta || "0"}</div>

    <hr>

    <div>${v.desc || "-"}</div>
`;

    const modal = new bootstrap.Modal(document.getElementById('modalVacante'));
    modal.show();
};