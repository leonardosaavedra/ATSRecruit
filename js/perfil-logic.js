import { auth, db, ref, get, update, onAuthStateChanged, signOut } from "./config.js";

const form = document.getElementById('formPerfilMaestro');
const inputNombre = document.getElementById('inputNombre');
const listaPostulaciones = document.getElementById('listaPostulaciones');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // Mostrar nombre en el Navbar
    document.getElementById('userNameNav').innerText = user.displayName || "Usuario";

    // 1. CARGAR DATOS EXISTENTES DESDE FIREBASE
    const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
    const snapshot = await get(userRef);
    
    // Valores por defecto desde Google Auth
    form.correo.value = user.email;
    if (!inputNombre.value) inputNombre.value = user.displayName;

    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Mapeo automático de campos simples
        const campos = [
            'nombre', 'whatsapp', 'edad', 'sexo', 'estado_civil', 
            'estado', 'municipio', 'licencia', 'vehiculo',
            'escolaridad', 'carrera', 'idioma_nombre', 'idioma_nivel',
            'exp_empresa1', 'exp_puesto1', 'exp_desc1',
            'mes_in', 'anio_in', 'mes_out', 'anio_out'
        ];

        campos.forEach(campo => {
            if (data[campo] !== undefined) {
                form[campo].value = data[campo];
            }
        });

        // Manejo del Checkbox "Sigo laborando aquí"
        if (data.actualmente_laborando) {
            form.actualmente_laborando.checked = true;
            document.getElementById('divSalida').classList.add('d-none');
        }

        // Manejo de Discapacidad
        if (data.tiene_discapacidad === 'Si') {
            form.tiene_discapacidad.value = 'Si';
            document.getElementById('wrapperDiscapacidad').classList.remove('d-none');
            form.detalle_discapacidad.value = data.detalle_discapacidad || '';
        }

        // Estado del CV
        if (data.cv_url) {
            document.getElementById('cvStatus').innerHTML = `
                <a href="${data.cv_url}" target="_blank" class="text-success fw-bold small">
                    <i class="fas fa-check-circle"></i> CV Actualizado (Ver archivo)
                </a>`;
        }

        // Cargar postulaciones del candidato
        cargarPostulaciones(user.uid);
    }
});

// 2. GUARDAR / ACTUALIZAR PERFIL
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const btn = document.getElementById('btnGuardarPerfil');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    // Recopilar datos
    const formData = new FormData(form);
    const perfil = Object.fromEntries(formData.entries());
    
    // Ajustar valores de checkboxes/switches (que no se envían si están vacíos)
    perfil.actualmente_laborando = form.actualmente_laborando.checked;
    perfil.perfil_completado = true;
    perfil.ultima_actualizacion = new Date().toISOString();

    try {
        await update(ref(db, `usuarios_candidatos/${user.uid}`), perfil);
        alert("¡Perfil actualizado con éxito!");
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Hubo un error al guardar los datos.");
    } finally {
        btn.disabled = false;
        btn.innerText = 'GUARDAR Y ACTUALIZAR PERFIL';
    }
});

// 3. CARGAR POSTULACIONES EN TIEMPO REAL
async function cargarPostulaciones(uid) {
    const postRef = ref(db, 'postulaciones');
    const snapshot = await get(postRef);

    if (snapshot.exists()) {
        listaPostulaciones.innerHTML = "";
        const data = snapshot.val();
        let tienePostulaciones = false;

        for (let id in data) {
            if (data[id].uid_candidato === uid) {
                tienePostulaciones = true;
                const p = data[id];
                listaPostulaciones.innerHTML += `
                    <div class="list-group-item border rounded mb-2 shadow-sm p-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0 fw-bold text-dark" style="font-size:0.85rem;">${p.puesto_vacante}</h6>
                            <span class="badge bg-info text-dark badge-status">${p.estatus || 'Recibida'}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted" style="font-size: 0.7rem;">
                                <i class="far fa-calendar-alt me-1"></i> ${new Date(p.fecha).toLocaleDateString()}
                            </span>
                            <span class="text-primary small" style="font-size: 0.7rem;">ID: ${id.substring(0,6)}</span>
                        </div>
                    </div>
                `;
            }
        }
        
        if (!tienePostulaciones) {
            listaPostulaciones.innerHTML = `
                <div class="text-center py-4 text-muted small">
                    <i class="fas fa-folder-open d-block mb-2 fa-2x"></i>
                    Aún no te has postulado a ninguna vacante.
                </div>`;
        }
    }
}

// Cerrar Sesión
document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});