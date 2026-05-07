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
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Postulando...';

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
        btn.innerHTML = '<i class="fas fa-check me-2"></i>Ya te postulaste';

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
        ? '<i class="fas fa-paper-plane me-2"></i>Postularse'
        : '<i class="fab fa-google me-2"></i>Inicia sesión para postularte';

    const urlCompartir = `${SHARE_BASE}/empleos/empleo.php?id=${id}`;

    const contenedor = document.getElementById('contenidoModal');

    contenedor.innerHTML = `
    <input type="hidden" id="inputIDModal" value="${id}">

    <!-- HEADER PREMIUM -->
    <div style="background:linear-gradient(135deg,#0a2d4f,#0D3B66);padding:24px 20px 20px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(247,127,0,0.15) 0%,transparent 70%);pointer-events:none;"></div>

        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(247,127,0,0.2);border:1px solid rgba(247,127,0,0.4);color:#FFB347;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#FFB347;display:inline-block;"></span>
            Vacante activa
        </div>

        <div style="font-size:19px;font-weight:700;color:white;line-height:1.25;margin-bottom:12px;">${v.titulo}</div>

        <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <span style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.75);font-size:12.5px;white-space:nowrap;">
                <i class="fas fa-map-marker-alt" style="color:#F77F00;font-size:11px;"></i>${v.ubicacion}
            </span>
            <span style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.75);font-size:12.5px;white-space:nowrap;">
                <i class="fas fa-briefcase" style="color:#F77F00;font-size:11px;"></i>${v.jornada}
            </span>
            <span style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.75);font-size:12.5px;white-space:nowrap;">
                <i class="fas fa-money-bill-wave" style="color:#F77F00;font-size:11px;"></i>$${Number(v.salarioDesde).toLocaleString()} — $${Number(v.salarioHasta).toLocaleString()}
            </span>
        </div>
    </div>

    <!-- DESCRIPCIÓN -->
    <div style="font-size:14px;line-height:1.75;color:#3a3a4a;padding:20px 20px 0;">
        ${v.desc || ''}
    </div>

    <!-- ACCIONES -->
    <div style="padding:16px 20px 20px;">
        <button id="btnPostularModal" class="btn btn-primary" style="padding:12px;border-radius:10px;font-weight:700;font-size:14px;border:none;background:#0D3B66;transition:all 0.2s;margin-bottom:10px;" onclick="window.enviarPostulacion()">
            ${textoBoton}
        </button>
        <br>
        <div style="display:flex;gap:10px;">
            <a href="https://wa.me/?text=${encodeURIComponent(urlCompartir)}" target="_blank"
             style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:#25D366;color:white;border:none;border-radius:10px;padding:10px;font-weight:600;font-size:13.5px;text-decoration:none;transition:all 0.2s;white-space:nowrap;">
            <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <button onclick="copiarLink('${urlCompartir}')"
            style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:white;color:#5a6a7a;border:1.5px solid #E8ECF0;border-radius:10px;padding:10px;font-weight:600;font-size:13.5px;cursor:pointer;transition:all 0.2s;white-space:nowrap;">
            <i class="fas fa-link"></i> Copiar link
        </button>
        </div>
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
                btn.innerHTML = '<i class="fas fa-check me-2"></i>Ya te postulaste';
                btn.style.background = '#198754';
            }
        }
    }

    modalBS.show();
};

// ============================
// 🔗 COPY LINK
// ============================
window.copiarLink = function (url) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url)
            .then(() => alert("Link copiado"))
            .catch(() => copiarFallback(url));
    } else {
        copiarFallback(url);
    }
};

function copiarFallback(url) {
    const input = document.createElement("input");
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    alert("Link copiado");
}

// ============================
// 🔐 LOGIN BTN
// ============================
document.getElementById('btnGoogle')?.addEventListener('click', async () => {
    await loginConGoogle();
    location.reload();
});