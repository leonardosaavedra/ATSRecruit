import { db, auth, ref, set, push, remove, onValue, update, signOut } from "./config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// Inicializamos los editores cuando el DOM esté listo
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
            ubicacion: formData.get('ubicacion'),
            salarioDesde: formData.get('salarioDesde'),
            salarioHasta: formData.get('salarioHasta'),
            jornada: formData.get('jornada'),
            horario: formData.get('horario'),
            // CAPTURAMOS EL HTML DEL EDITOR
            desc: quillRegistro ? quillRegistro.root.innerHTML : formData.get('desc'),
            estado: "Activa",
            fecha: new Date().toISOString(),
            postulados: 0
        };

        push(ref(db, 'vacantes'), nuevaVacante)
            .then(() => {
                alert("Vacante publicada con éxito");
                formVacante.reset();
                if (quillRegistro) quillRegistro.setContents([]); // Limpiar editor
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
                    if(v.estado === "Pausada") statusClass = "bg-warning text-dark";
                    if(v.estado === "Cerrada") statusClass = "bg-danger";

                    tr.innerHTML = `
                        <td class="small text-muted font-monospace">${idCompleto.substring(0, 6)}</td>
                        <td class="fw-bold">${v.titulo}</td>
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
    document.getElementById('editVacanteId').value = id;
    document.getElementById('editVacTitulo').value = data.titulo;
    document.getElementById('editVacUbicacion').value = data.ubicacion;
    document.getElementById('editVacSalarioDesde').value = data.salarioDesde || "";
    document.getElementById('editVacSalarioHasta').value = data.salarioHasta || "";
    document.getElementById('editVacJornada').value = data.jornada || "Tiempo Completo";
    document.getElementById('editVacHorario').value = data.horario || "Lunes a Viernes";
    document.getElementById('editVacEstado').value = data.estado || "Activa";
    
    // CARGAR CONTENIDO AL EDITOR DE EDICIÓN
    if (quillEdicion) {
        quillEdicion.root.innerHTML = data.desc || "";
    }

    const modal = new bootstrap.Modal(document.getElementById('modalEditarVacante'));
    modal.show();
};

const formEditarVacante = document.getElementById('formEditarVacante');
if (formEditarVacante) {
    formEditarVacante.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editVacanteId').value;
        
        const updates = {
            titulo: document.getElementById('editVacTitulo').value,
            ubicacion: document.getElementById('editVacUbicacion').value,
            salarioDesde: document.getElementById('editVacSalarioDesde').value,
            salarioHasta: document.getElementById('editVacSalarioHasta').value,
            jornada: document.getElementById('editVacJornada').value,
            horario: document.getElementById('editVacHorario').value,
            estado: document.getElementById('editVacEstado').value,
            // CAPTURAMOS EL HTML ACTUALIZADO DEL EDITOR DE EDICIÓN
            desc: quillEdicion ? quillEdicion.root.innerHTML : ""
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

        if (pass.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            await set(ref(db, `usuarios/${uid}`), {
                nombre: nombre,
                email: email,
                rol: rol,
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
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold">${u.nombre || 'N/A'}</td>
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
                
                tr.querySelector('.btn-editar-user').onclick = () => window.prepararEdicion(key, u.nombre, u.rol);
                tr.querySelector('.btn-borrar-user').onclick = () => window.borrarUsuario(key);
                tablaUsuarios.appendChild(tr);
            });
        }
    });
}

window.prepararEdicion = (id, nombre, rol) => {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').value = nombre;
    document.getElementById('editUserRole').value = rol;
    
    const m = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    m.show();
};

const formEditarUser = document.getElementById('formEditarUsuario');
if (formEditarUser) {
    formEditarUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const nombre = document.getElementById('editUserName').value;
        const rol = document.getElementById('editUserRole').value;

        try {
            await update(ref(db, `usuarios/${id}`), { nombre, rol });
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

// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    window.obtenerVacantes();
    cargarUsuarios();
});