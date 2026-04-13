import { db, ref, get, child, push, set, auth, onAuthStateChanged } from './config.js';

const listaVacantes = document.getElementById('listaVacantes');
const authContainer = document.getElementById('auth-container');

// 1. Lógica para mostrar el usuario logueado en el Header
onAuthStateChanged(auth, (user) => {
    if (user && authContainer) {
        authContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle fw-bold btn-sm" type="button" data-bs-toggle="dropdown">
                    <img src="${user.photoURL || 'https://via.placeholder.com/25'}" width="20" class="rounded-circle me-1" onerror="this.src='https://via.placeholder.com/20'"> 
                    ${user.displayName.split(' ')[0]}
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                    <li><a class="dropdown-item" href="perfil-candidato.html"><i class="fas fa-user-circle me-2"></i>Mi Perfil</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" id="btnCerrarSesionJS"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</button></li>
                </ul>
            </div>`;
        
        document.getElementById('btnCerrarSesionJS')?.addEventListener('click', () => {
            auth.signOut().then(() => window.location.reload());
        });
    }
});

function formatearMoneda(valor) {
    if (!valor || valor === "" || isNaN(valor)) return "0";
    return Number(valor).toLocaleString('en-US');
}

// --- CARGAR VACANTES CON AUTO-SELECCIÓN DE LA PRIMERA ---
async function cargarVacantes() {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'vacantes'));

        if (snapshot.exists()) {
            listaVacantes.innerHTML = '';
            const datos = snapshot.val();
            const keys = Object.keys(datos);

            keys.forEach((id) => {
                const v = datos[id];
                if (v.estado === "Activa") {
                    const card = document.createElement('div');
                    card.className = 'col-12'; // Ocupa todo el ancho
                    
                    // Diseño basado en tu referencia: Tarjeta horizontal moderna
                    card.innerHTML = `
                        <div class="card card-vacante-moderna shadow-sm p-4 mb-3" onclick="window.abrirModalVacante('${id}')">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <div class="d-flex align-items-center mb-2">
                                        <span class="badge bg-primary-subtle text-primary me-2">Nueva vacante</span>
                                        <span class="text-muted small"><i class="far fa-clock me-1"></i> Publicado recientemente</span>
                                    </div>
                                    <h4 class="fw-bold mb-1 text-dark">${v.titulo}</h4>
                                    <p class="text-muted mb-0">
                                        <i class="fas fa-map-marker-alt text-primary me-2"></i>${v.ubicacion} 
                                        <span class="mx-2">•</span> 
                                        <i class="fas fa-briefcase text-primary me-2"></i>${v.jornada}
                                    </p>
                                </div>
                                <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                    <p class="small text-muted mb-0">Sueldo mensual bruto</p>
                                    <h5 class="fw-bold text-dark mb-2">$${formatearMoneda(v.salarioDesde)} - $${formatearMoneda(v.salarioHasta)}</h5>
                                    <button class="btn btn-outline-primary rounded-pill px-4">Ver detalles</button>
                                </div>
                            </div>
                        </div>
                    `;
                    listaVacantes.appendChild(card);
                }
            });
        } else {
            listaVacantes.innerHTML = '<p class="text-center py-5 text-muted">No hay vacantes activas en este momento.</p>';
        }
    } catch (error) {
        console.error("Error al cargar vacantes:", error);
    }
}

// --- MOSTRAR DETALLE CON VALIDACIÓN DE REGISTRO PREVIO ---
async function mostrarDetalle(id, v) {
    vacio.classList.add('d-none');
    detalleInfo.classList.remove('d-none');

    document.getElementById('txtTitulo').innerText = v.titulo;
    document.getElementById('inputID').value = id;

    const btnPostular = document.querySelector('.header-actions button');
    
    // Resetear botón a estado inicial azul
    btnPostular.disabled = false;
    btnPostular.classList.remove('btn-success');
    btnPostular.classList.add('btn-primary');
    btnPostular.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Postularse ahora';

    // Verificamos si el usuario logueado ya se postuló a ESTA vacante
    if (auth.currentUser) {
        try {
            const postRef = ref(db, 'postulaciones');
            const postSnap = await get(postRef);
            
            if (postSnap.exists()) {
                const data = postSnap.val();
                const yaPostulado = Object.values(data).some(p => 
                    p.uid_candidato === auth.currentUser.uid && p.id_vacante === id
                );

                if (yaPostulado) {
                    btnPostular.disabled = true;
                    btnPostular.classList.replace('btn-primary', 'btn-success');
                    btnPostular.innerHTML = '<i class="fas fa-check me-2"></i> Ya te has postulado';
                }
            }
        } catch (e) { console.error("Error verificando:", e); }
    }

    const txtDesc = document.getElementById('txtDescripcion');
    txtDesc.innerHTML = v.desc ? v.desc.replace(/\n/g, '<br>') : "Sin descripción disponible.";

    const salMin = formatearMoneda(v.salarioDesde);
    const salMax = formatearMoneda(v.salarioHasta);

    document.getElementById('txtIconos').innerHTML = `
        <div class="info-empleo-box p-3 bg-light rounded-3 mb-4 shadow-sm border-start">
            <h6 class="fw-bold text-dark mb-3">Información del empleo</h6>
            <div class="row g-2">
                <div class="col-12 small mb-2"><i class="fas fa-money-bill-wave text-primary me-2"></i><strong>Sueldo:</strong> $${salMin} a $${salMax}</div>
                <div class="col-12 small mb-2"><i class="fas fa-briefcase text-primary me-2"></i><strong>Jornada:</strong> ${v.jornada || 'N/A'}</div>
                <div class="col-12 small"><i class="fas fa-map-marker-alt text-primary me-2"></i><strong>Ubicación:</strong> ${v.ubicacion || 'N/A'}</div>
            </div>
        </div>`;
}

// --- FUNCIÓN PARA COPIAR DATOS A POSTULACIONES ---
window.abrirForm = async function() {
    const idVacante = document.getElementById('inputID').value;
    const tituloVacante = document.getElementById('txtTitulo').innerText;
    const user = auth.currentUser;

    if (!idVacante || !user) return;

    const btn = document.querySelector('.header-actions button');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    try {
        const candidatoSnap = await get(ref(db, `usuarios_candidatos/${user.uid}`));
        if (!candidatoSnap.exists()) {
            alert("Completa tu perfil primero.");
            window.location.href = "perfil-candidato.html";
            return;
        }

        const perfil = candidatoSnap.val();

        const nuevaPostulacion = {
            ...perfil,
            id_vacante: idVacante,
            puesto_vacante: tituloVacante,
            uid_candidato: user.uid,
            fecha_postulacion: new Date().toLocaleString(),
            estatus: "Recibida"
        };

        await set(push(ref(db, 'postulaciones')), nuevaPostulacion);
        
        alert("¡Postulación exitosa!");
        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = '<i class="fas fa-check me-2"></i> Ya te has postulado';

    } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Postularse ahora';
    }
};

cargarVacantes();