import { auth, onAuthStateChanged, db, ref, get, set, push, child, SHARE_BASE } from './config.js';
import { loginConGoogle } from './auth-candidatos.js';

window.usuarioActual = null;

const modalElement = document.getElementById('modalVacante');
const modalBS = new bootstrap.Modal(modalElement);

// ============================
// 🔐 AUTH HEADER
// ============================
onAuthStateChanged(auth, async (user) => {
    const containerCandidato = document.getElementById('auth-container');
    const containerReclutador = document.getElementById('auth-container-reclutador');

    if (user) {
        window.usuarioActual = user;

        try {
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `usuarios/${user.uid}`));

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const nombreReclutador = userData.nombre || "Reclutador";

                containerReclutador.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle fw-bold btn-sm shadow-sm" data-bs-toggle="dropdown">
                            <i class="fas fa-user-tie me-1"></i> ${nombreReclutador}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><a class="dropdown-item" href="recruit/reclutador.html">Mi Panel</a></li>
                            <li><button class="dropdown-item text-danger" id="btnCerrarSesionRecruit">Cerrar Sesión</button></li>
                        </ul>
                    </div>
                `;

                document.getElementById('btnCerrarSesionRecruit')
                    .addEventListener('click', () => auth.signOut().then(() => location.reload()));

                if (containerCandidato) containerCandidato.style.display = 'none';

            } else {

                containerCandidato.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle fw-bold btn-sm shadow-sm" data-bs-toggle="dropdown">
                            <img src="${user.photoURL || ''}" width="30" class="rounded-circle me-1">
                            ${user.displayName?.split(' ')[0] || 'Perfil'}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><a class="dropdown-item" href="candidatos/cv-candidato.html">Mi Perfil</a></li>
                            <li><button class="dropdown-item text-danger" id="btnCerrarSesionIndex">Cerrar Sesión</button></li>
                        </ul>
                    </div>
                `;

                document.getElementById('btnCerrarSesionIndex')
                    .addEventListener('click', () => auth.signOut().then(() => location.reload()));

                if (containerReclutador) containerReclutador.style.display = 'none';
            }

        } catch (error) {
            console.error(error);
        }
    }
});

// ============================
// 🚀 POSTULACIÓN
// ============================
window.enviarPostulacion = async function () {

    const idV = document.getElementById('inputIDModal').value;
    const btn = document.getElementById('btnPostularModal');

    if (!window.usuarioActual) {
        await loginConGoogle();
        location.reload();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Postulando...';

    try {

        const userRef = ref(db, `usuarios_candidatos/${window.usuarioActual.uid}`);
        const snapshot = await get(userRef);
        const datosUsuario = snapshot.val();

        if (!datosUsuario || datosUsuario.perfil_completado === false) {
            alert("Completa tu perfil primero");
            window.location.href = 'perfil-candidato.html';
            return;
        }

        const dataParaInsertar = {
            ...datosUsuario,
            id_vacante: idV,
            uid_candidato: window.usuarioActual.uid,
            fecha_postulacion: new Date().toLocaleString(),
            estado_proceso: "Pendiente"
        };

        await set(push(ref(db, 'postulaciones')), dataParaInsertar);

        btn.classList.replace('btn-primary', 'btn-success');
        btn.innerHTML = 'Ya te postulaste';

    } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = 'Postularse';
    }
};

// ============================
// 📦 MODAL VACANTE
// ============================
window.abrirModalVacante = async function (id) {

    const snap = await get(ref(db, `vacantes/${id}`));
    if (!snap.exists()) return;

    const v = snap.val();

    const textoBoton = window.usuarioActual
        ? 'Postularse'
        : 'Inicia sesión para postularte';

    const urlCompartir = `${SHARE_BASE}/empleos/empleo.php?id=${id}`;

    const contenedor = document.getElementById('contenidoModal');

    contenedor.innerHTML = `
        <input type="hidden" id="inputIDModal" value="${id}">

        <h3 class="fw-bold">${v.titulo}</h3>

        <p>${v.ubicacion} | ${v.jornada}</p>

        <p>$${Number(v.salarioDesde).toLocaleString()} - $${Number(v.salarioHasta).toLocaleString()}</p>

        <div>${v.desc || ''}</div>

        <button id="btnPostularModal" class="btn btn-primary w-100 mt-3" onclick="window.enviarPostulacion()">
            ${textoBoton}
        </button>

        <div class="d-flex gap-2 mt-3">
            <a href="https://wa.me/?text=${encodeURIComponent(urlCompartir)}" target="_blank" class="btn btn-success w-50">
                <i class="fab fa-whatsapp me-1"></i> WhatsApp
            </a>

            <button class="btn btn-outline-secondary w-50" onclick="copiarLink('${urlCompartir}')">
                <i class="fas fa-link me-1"></i> Copiar link
            </button>
        </div>
    `;

    // 🔥 verificar si ya se postuló
    if (window.usuarioActual) {

        const postSnap = await get(ref(db, 'postulaciones'));

        if (postSnap.exists()) {

            const yaPostulado = Object.values(postSnap.val()).some(p =>
                p.uid_candidato === window.usuarioActual.uid &&
                p.id_vacante === id
            );

            if (yaPostulado) {
                const btn = document.getElementById('btnPostularModal');
                btn.disabled = true;
                btn.classList.replace('btn-primary', 'btn-success');
                btn.innerHTML = 'Ya te postulaste';
            }
        }
    }

    modalBS.show();
};

// ============================
// 🔗 COPY LINK
// ============================
window.copiarLink = function (url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado");
};

// ============================
// 🔐 LOGIN BTN
// ============================
document.getElementById('btnGoogle')?.addEventListener('click', async () => {
    await loginConGoogle();
    location.reload();
});