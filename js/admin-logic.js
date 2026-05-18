import { db, auth, ref, set, push, remove, onValue, update, signOut } from "./config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { sedes, estados } from './data.js';

// ==========================================
// 0. CONFIGURACIÓN DE QUILL (EDITOR DE TEXTO)
// ==========================================
const toolbarOptions = [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'header': [1, 2, false] }],
    ['clean']
];

let quillRegistro;
let quillEdicion;

// Helper para llenar un select evitando duplicados
function llenarSelect(id, opciones, esObjeto = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.options.length <= 1) {
        opciones.forEach(op => {
            el.innerHTML += esObjeto
                ? `<option value="${op.id}">${op.label}</option>`
                : `<option value="${op}">${op}</option>`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // ── QUILL ──
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

    // ── SELECTS FORMULARIO PRINCIPAL (siempre visibles en el DOM) ──
    llenarSelect('selectSedeVacante', sedes, true);
    llenarSelect('selectEstadoVacante', estados);

    const selectUserSede = document.getElementById('userSede');
    if (selectUserSede && selectUserSede.options.length <= 1) {
        selectUserSede.innerHTML += `<option value="ambas">Ambas sedes</option>`;
        sedes.forEach(s => selectUserSede.innerHTML += `<option value="${s.id}">${s.label}</option>`);
    }

    // ── SELECTS DE MODALES — llenar cuando Bootstrap abra el modal ──
    document.getElementById('modalEditarVacante')?.addEventListener('show.bs.modal', () => {
        llenarSelect('editVacSede', sedes, true);
        llenarSelect('editVacUbicacion', estados);
    });

    document.getElementById('modalEditarUsuario')?.addEventListener('show.bs.modal', () => {
        const s = document.getElementById('editUserSede');
        if (s && s.options.length <= 1) {
            s.innerHTML += `<option value="ambas">Ambas sedes</option>`;
            sedes.forEach(x => s.innerHTML += `<option value="${x.id}">${x.label}</option>`);
        }
    });

    window.obtenerVacantes();
    cargarUsuarios();
});

// ==========================================
// 1. SESIÓN Y LOGOUT
// ==========================================
document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        signOut(auth).then(() => {
            window.location.href = "../login.html";
        }).catch(err => console.error("Error al salir:", err));
    }
});

// ==========================================
// 2. GESTIÓN DE VACANTES
// ==========================================
const formVacante = document.getElementById('formNuevaVacante');
if (formVacante) {
    formVacante.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formVacante);

        const nuevaVacante = {
            titulo: formData.get('titulo'),
            sede: formData.get('sede'),
            ubicacion: formData.get('ubicacion'),
            direccion: formData.get('direccionEmpleo') || '',
            salarioDesde: formData.get('salarioDesde'),
            salarioHasta: formData.get('salarioHasta'),
            jornada: formData.get('jornada'),
            horario: formData.get('horario'),
            desc: quillRegistro ? quillRegistro.root.innerHTML : formData.get('desc'),
            estado: "Activa",
            fecha: new Date().toISOString(),
            postulados: 0
        };

        push(ref(db, 'vacantes'), nuevaVacante)
            .then(() => {
                alert("Vacante publicada con éxito");
                formVacante.reset();
                if (quillRegistro) quillRegistro.setContents([]);
            });
    });
}

window.obtenerVacantes = () => {
    const tabla = document.getElementById('tablaCuerpo');
    if (!tabla) return;

    onValue(ref(db, 'vacantes'), (snapshotVac) => {
        const vacantesData = snapshotVac.val();

        onValue(ref(db, 'postulaciones'), (snapshotPost) => {
            tabla.innerHTML = '';
            const postulacionesData = snapshotPost.val() || {};

            if (vacantesData) {
                Object.keys(vacantesData).forEach(idCompleto => {
                    const v = vacantesData[idCompleto];
                    const totalPostulados = Object.values(postulacionesData).filter(p =>
                        p.inputID === idCompleto || p.id_vacante === idCompleto
                    ).length;

                    const tr = document.createElement('tr');
                    let statusClass = "bg-success";
                    if (v.estado === "Pausada") statusClass = "bg-warning text-dark";
                    if (v.estado === "Cerrada") statusClass = "bg-danger";

                    const sedeLabel = sedes.find(s => s.id === v.sede)?.label || v.sede || '—';

                    tr.innerHTML = `
                        <td class="small text-muted font-monospace">${idCompleto.substring(0, 6)}</td>
                        <td>
                            <div class="fw-bold">${v.titulo}</div>
                            <div class="small text-muted">${sedeLabel} · ${v.ubicacion || ''}</div>
                        </td>
                        <td class="text-center">
                            <a href="candidatos.html?id=${idCompleto}" class="text-decoration-none">
                                <span class="badge ${totalPostulados > 0 ? 'bg-primary' : 'bg-secondary'}" style="cursor:pointer">
                                    <i class="fa-solid fa-user me-1"></i>Postulados ${totalPostulados}
                                </span>
                            </a>
                        </td>
                        <td class="text-center"><span class="badge ${statusClass}">${v.estado || 'Activa'}</span></td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary border-0 btn-editar-vacante">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0 btn-eliminar">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>`;

                    tr.querySelector('.btn-editar-vacante').onclick = () => window.prepararEdicionVacante(idCompleto, v);
                    tr.querySelector('.btn-eliminar').onclick = () => window.eliminarVacante(idCompleto);
                    tabla.appendChild(tr);
                });
            } else {
                tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay vacantes</td></tr>';
            }
        });
    });
};

window.eliminarVacante = (id) => {
    if (confirm("¿Eliminar esta vacante definitivamente?")) {
        remove(ref(db, `vacantes/${id}`));
    }
};

window.prepararEdicionVacante = (id, data) => {

    // ── LLENAR SELECTS PRIMERO ──
    const editSede = document.getElementById('editVacSede');
    if (editSede && editSede.options.length <= 1) {
        sedes.forEach(s => editSede.innerHTML += `<option value="${s.id}">${s.label}</option>`);
    }
    const editUbicacion = document.getElementById('editVacUbicacion');
    if (editUbicacion && editUbicacion.options.length <= 1) {
        estados.forEach(e => editUbicacion.innerHTML += `<option value="${e}">${e}</option>`);
    }

    // ── ASIGNAR VALORES ──
    document.getElementById('editVacanteId').value = id;
    document.getElementById('editVacTitulo').value = data.titulo;
    document.getElementById('editVacDireccion').value = data.direccion || '';
    if (editSede) editSede.value = data.sede || '';
    if (editUbicacion) editUbicacion.value = data.ubicacion || '';
    document.getElementById('editVacSalarioDesde').value = data.salarioDesde || '';
    document.getElementById('editVacSalarioHasta').value = data.salarioHasta || '';
    document.getElementById('editVacJornada').value = data.jornada || 'Tiempo Completo';
    document.getElementById('editVacHorario').value = data.horario || 'Lunes a Viernes';
    document.getElementById('editVacEstado').value = data.estado || 'Activa';

    if (quillEdicion) quillEdicion.root.innerHTML = data.desc || '';

    new bootstrap.Modal(document.getElementById('modalEditarVacante')).show();
};

const formEditarVacante = document.getElementById('formEditarVacante');
if (formEditarVacante) {
    formEditarVacante.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editVacanteId').value;

        const updates = {
            titulo: document.getElementById('editVacTitulo').value,
            sede: document.getElementById('editVacSede')?.value || '',
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

document.getElementById('btnRefrescarVacantes')?.addEventListener('click', window.obtenerVacantes);

// ==========================================
// 3. GESTIÓN DE USUARIOS
// ==========================================
const formUser = document.getElementById('formNuevoUsuario');
if (formUser) {
    formUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('userEmail').value;
        const nombre = document.getElementById('userName').value;
        const pass = document.getElementById('userPass').value;
        const rol = document.getElementById('userRole').value;
        const sede = document.getElementById('userSede')?.value || '';

        if (pass.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            await set(ref(db, `usuarios/${uid}`), {
                nombre,
                email,
                rol,
                sede,
                fechaCreacion: new Date().toISOString()
            });

            alert(`Usuario ${nombre} creado correctamente.`);
            formUser.reset();
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

function cargarUsuarios() {
    const tablaUsuarios = document.getElementById('tablaUsuariosBody');
    if (!tablaUsuarios) return;

    onValue(ref(db, 'usuarios'), (snapshot) => {
        tablaUsuarios.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach((key) => {
                const u = data[key];
                const sedeLabel = u.sede === 'ambas'
                    ? 'Ambas sedes'
                    : sedes.find(s => s.id === u.sede)?.label || '—';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="fw-bold">${u.nombre || 'N/A'}</div>
                        <div class="small text-muted">${sedeLabel}</div>
                    </td>
                    <td class="small">${u.email}</td>
                    <td>
                        <span class="badge ${u.rol === 'admin' ? 'bg-danger' : 'bg-info'} text-uppercase">
                            ${u.rol}
                        </span>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary border-0 btn-editar-user">
                            <i class="fa-solid fa-user-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger border-0 btn-borrar-user">
                            <i class="fa-solid fa-user-xmark"></i>
                        </button>
                    </td>`;

                tr.querySelector('.btn-editar-user').onclick = () => window.prepararEdicion(key, u);
                tr.querySelector('.btn-borrar-user').onclick = () => window.borrarUsuario(key);
                tablaUsuarios.appendChild(tr);
            });
        }
    });
}

window.prepararEdicion = (id, u) => {

    // ── LLENAR SELECT PRIMERO ──
    const editSede = document.getElementById('editUserSede');
    if (editSede && editSede.options.length <= 1) {
        editSede.innerHTML += `<option value="ambas">Ambas sedes</option>`;
        sedes.forEach(s => editSede.innerHTML += `<option value="${s.id}">${s.label}</option>`);
    }

    // ── ASIGNAR VALORES ──
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').value = u.nombre;
    document.getElementById('editUserRole').value = u.rol;
    if (editSede) editSede.value = u.sede || '';

    new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
};

const formEditarUser = document.getElementById('formEditarUsuario');
if (formEditarUser) {
    formEditarUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const nombre = document.getElementById('editUserName').value;
        const rol = document.getElementById('editUserRole').value;
        const sede = document.getElementById('editUserSede')?.value || '';

        try {
            await update(ref(db, `usuarios/${id}`), { nombre, rol, sede });
            alert("Cambios guardados.");
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
}

window.borrarUsuario = (id) => {
    if (confirm("¿Retirar acceso a este usuario?")) {
        remove(ref(db, `usuarios/${id}`));
    }
};