import { db, auth, ref, set, push, remove, onValue, update, signOut, onAuthStateChanged, get, child } from "./config.js";
import { sedes, estados } from './data.js';

// ==========================================
// 0. CONFIGURACIÓN DE QUILL
// ==========================================
const toolbarOptions = [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'header': [1, 2, false] }],
    ['clean']
];

let quillRegistro;
let quillEdicion;
let sedeReclutador = null;
let rolReclutador = null;

// ==========================================
// 1. OBTENER DATOS DEL USUARIO LOGUEADO
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
        const snapshot = await get(child(ref(db), `usuarios/${user.uid}`));
        if (snapshot.exists()) {
            const userData = snapshot.val();
            sedeReclutador = userData.sede || null;
            rolReclutador = userData.rol || 'reclutador';

            // Mostrar nombre en navbar
            const nombreEl = document.getElementById('nombreReclutador');
            if (nombreEl) nombreEl.textContent = userData.nombre || 'Reclutador';

            // Mostrar sede en el welcome banner
            const sedeLabel = sedeReclutador === 'ambas'
                ? 'Todas las sedes'
                : sedes.find(s => s.id === sedeReclutador)?.label || sedeReclutador || '';

            const subEl = document.querySelector('.rec-welcome-sub');
            if (subEl && sedeLabel) {
                subEl.textContent = `Sede: ${sedeLabel} — Gestiona tus vacantes y encuentra el mejor talento.`;
            }

            cargarVacantes();
        }
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
    }
});

// ==========================================
// 2. SESIÓN Y LOGOUT
// ==========================================
document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        signOut(auth).then(() => {
            window.location.href = "../login.html";
        }).catch(err => console.error("Error al salir:", err));
    }
});

// ==========================================
// 3. INICIALIZAR QUILL + SELECTS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('editor-registro')) {
        quillRegistro = new Quill('#editor-registro', {
            modules: { toolbar: toolbarOptions },
            theme: 'snow',
            placeholder: 'Detalla los requisitos y beneficios...'
        });
    }
    if (document.getElementById('editor-edicion')) {
        quillEdicion = new Quill('#editor-edicion', {
            modules: { toolbar: toolbarOptions },
            theme: 'snow'
        });
    }

    // ── LLENAR SELECT ESTADO (form publicar) ──
    const recSelectEstado = document.getElementById('recSelectEstado');
    if (recSelectEstado) {
        estados.forEach(e => {
            recSelectEstado.innerHTML += `<option value="${e}">${e}</option>`;
        });
    }

    // ── LLENAR SELECT ESTADO (modal editar) ──
    const editSelectEstado = document.getElementById('editVacUbicacion');
    if (editSelectEstado && editSelectEstado.tagName === 'SELECT' && editSelectEstado.options.length <= 1) {
        estados.forEach(e => {
            editSelectEstado.innerHTML += `<option value="${e}">${e}</option>`;
        });
    }
});

// ==========================================
// 4. CARGAR VACANTES FILTRADAS POR SEDE
// ==========================================
function cargarVacantes() {
    const tabla = document.getElementById('tablaCuerpo');
    if (!tabla) return;

    onValue(ref(db, 'vacantes'), (snapshotVac) => {
        const vacantesData = snapshotVac.val();

        onValue(ref(db, 'postulaciones'), (snapshotPost) => {
            tabla.innerHTML = '';
            const postulacionesData = snapshotPost.val() || {};

            if (!vacantesData) {
                tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay vacantes</td></tr>';
                return;
            }

            let hayVacantes = false;

            Object.keys(vacantesData).forEach(id => {
                const v = vacantesData[id];

                const puedeVer = rolReclutador === 'admin'
                    || sedeReclutador === 'ambas'
                    || !sedeReclutador
                    || v.sede === sedeReclutador;

                if (!puedeVer) return;

                hayVacantes = true;

                const totalPostulados = Object.values(postulacionesData).filter(p =>
                    p.inputID === id || p.id_vacante === id
                ).length;

                let statusClass = "rec-badge-activa";
                if (v.estado === "Pausada") statusClass = "rec-badge-pausada";
                if (v.estado === "Cerrada") statusClass = "rec-badge-cerrada";

                const sedeLabel = sedes.find(s => s.id === v.sede)?.label || v.sede || '—';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="small text-muted font-monospace">${id.substring(0, 6)}</td>
                    <td>
                        <div class="fw-bold">${v.titulo}</div>
                        <div class="small text-muted">${sedeLabel} · ${v.ubicacion || ''}</div>
                    </td>
                    <td class="text-center">
                        <a href="candidatos.html?id=${id}" class="text-decoration-none">
                            <span class="badge ${totalPostulados > 0 ? 'bg-primary' : 'bg-secondary'}" style="cursor:pointer">
                                <i class="fa-solid fa-user me-1"></i>${totalPostulados}
                            </span>
                        </a>
                    </td>
                    <td class="text-center">
                        <span class="rec-badge ${statusClass}">${v.estado || 'Activa'}</span>
                    </td>
                    <td class="text-end">
                        <button class="btn-rec-icon btn-editar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-rec-icon danger btn-eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>`;

                tr.querySelector('.btn-editar').onclick = () => prepararEdicion(id, v);
                tr.querySelector('.btn-eliminar').onclick = () => eliminarVacante(id);
                tabla.appendChild(tr);
            });

            if (!hayVacantes) {
                tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay vacantes para tu sede</td></tr>';
            }
        });
    });
}

// ==========================================
// 5. PUBLICAR VACANTE
// ==========================================
const formVacante = document.getElementById('formNuevaVacante');
if (formVacante) {
    formVacante.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formVacante);

        const nuevaVacante = {
            titulo: formData.get('titulo'),
            sede: sedeReclutador || '',
            ubicacion: formData.get('ubicacion'),
            direccion: formData.get('direccionEmpleo') || '',
            salarioDesde: formData.get('salarioDesde'),
            salarioHasta: formData.get('salarioHasta'),
            jornada: formData.get('jornada'),
            horario: formData.get('horario'),
            desc: quillRegistro ? quillRegistro.root.innerHTML : '',
            estado: "Activa",
            fecha: new Date().toISOString(),
            postulados: 0
        };

        push(ref(db, 'vacantes'), nuevaVacante)
            .then(() => {
                alert("Vacante publicada con éxito");
                formVacante.reset();
                if (quillRegistro) quillRegistro.setContents([]);
            })
            .catch(err => alert("Error: " + err.message));
    });
}

// ==========================================
// 6. ELIMINAR VACANTE
// ==========================================
function eliminarVacante(id) {
    if (confirm("¿Eliminar esta vacante definitivamente?")) {
        remove(ref(db, `vacantes/${id}`));
    }
}

// ==========================================
// 7. EDITAR VACANTE
// ==========================================
function prepararEdicion(id, data) {

    // ── LLENAR SELECT ESTADO SI AÚN NO TIENE OPCIONES ──
    const editUbicacion = document.getElementById('editVacUbicacion');
    if (editUbicacion && editUbicacion.tagName === 'SELECT' && editUbicacion.options.length <= 1) {
        estados.forEach(e => editUbicacion.innerHTML += `<option value="${e}">${e}</option>`);
    }

    document.getElementById('editVacanteId').value = id;
    document.getElementById('editVacTitulo').value = data.titulo;
    document.getElementById('editVacDireccion').value = data.direccion || '';
    if (editUbicacion) editUbicacion.value = data.ubicacion || '';
    document.getElementById('editVacSalarioDesde').value = data.salarioDesde || '';
    document.getElementById('editVacSalarioHasta').value = data.salarioHasta || '';
    document.getElementById('editVacJornada').value = data.jornada || 'Tiempo Completo';
    document.getElementById('editVacHorario').value = data.horario || 'Lunes a Viernes';
    document.getElementById('editVacEstado').value = data.estado || 'Activa';

    if (quillEdicion) quillEdicion.root.innerHTML = data.desc || '';

    new bootstrap.Modal(document.getElementById('modalEditarVacante')).show();
}

const formEditarVacante = document.getElementById('formEditarVacante');
if (formEditarVacante) {
    formEditarVacante.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editVacanteId').value;

        const updates = {
            titulo: document.getElementById('editVacTitulo').value,
            ubicacion: document.getElementById('editVacUbicacion').value,
            direccion: document.getElementById('editVacDireccion')?.value || '',
            salarioDesde: document.getElementById('editVacSalarioDesde').value,
            salarioHasta: document.getElementById('editVacSalarioHasta').value,
            jornada: document.getElementById('editVacJornada').value,
            horario: document.getElementById('editVacHorario').value,
            estado: document.getElementById('editVacEstado').value,
            desc: quillEdicion ? quillEdicion.root.innerHTML : ''
        };

        try {
            await update(ref(db, `vacantes/${id}`), updates);
            alert("Vacante actualizada correctamente");
            bootstrap.Modal.getInstance(document.getElementById('modalEditarVacante')).hide();
        } catch (error) {
            alert("Error al actualizar: " + error.message);
        }
    });
}

document.getElementById('btnRefrescarVacantes')?.addEventListener('click', cargarVacantes);