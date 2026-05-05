<?php

function limpiarHTMLQuill($html) {
    $html = preg_replace('/<span class="ql-ui".*?<\/span>/', '', $html);
    $html = preg_replace('/ contenteditable="false"/', '', $html);
    $html = strip_tags($html, '<p><br><strong><b><ul><ol><li><em>');
    return $html;
}

$id = $_GET['id'] ?? '';

// 🔥 DETECCIÓN AUTOMÁTICA
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];

// 🔥 Detecta automáticamente la carpeta donde está este archivo
$scriptUrl = $_SERVER['SCRIPT_NAME'];
$urlActual = $protocol . "://" . $host . $scriptUrl . "?id=" . $id;

$imagen = $protocol . "://" . $host . "/logo.png";

// 🔹 Firebase
$firebaseUrl = "https://r-ats-recruit-default-rtdb.firebaseio.com/vacantes/$id.json";
$response = @file_get_contents($firebaseUrl);
$data = $response ? json_decode($response, true) : null;

// 🔥 DATOS
$titulo = htmlspecialchars($data['titulo'] ?? 'Vacante disponible');
$desc = $data['desc'] ?? '';
$descLimpia = limpiarHTMLQuill($desc);

$ubicacion = htmlspecialchars($data['ubicacion'] ?? 'No especificada');

// 🔹 Salario
$salarioDesde = isset($data['salarioDesde']) ? (int)$data['salarioDesde'] : 0;
$salarioHasta = isset($data['salarioHasta']) ? (int)$data['salarioHasta'] : 0;

function formatearMoneda($valor) {
    return "$" . number_format($valor, 0, '.', ',');
}

if ($salarioDesde && $salarioHasta) {
    $salarioMostrar = formatearMoneda($salarioDesde) . " - " . formatearMoneda($salarioHasta);
} elseif ($salarioDesde) {
    $salarioMostrar = formatearMoneda($salarioDesde);
} else {
    $salarioMostrar = "A tratar";
}

$jornada = htmlspecialchars($data['jornada'] ?? 'No especificada');

?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title><?php echo $titulo; ?></title>

<meta property="og:title" content="<?php echo $titulo; ?>">
<meta property="og:description" content="Consulta esta vacante en 3R Laboral">
<meta property="og:type" content="website">
<meta property="og:url" content="<?php echo $urlActual; ?>">
<meta property="og:image" content="<?php echo $imagen; ?>">

<meta name="twitter:card" content="summary_large_image">

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="../css/empleo.css">

</head>
<body>

<!-- 🔥 NAVBAR -->
<nav class="navbar navbar-light bg-white border-bottom py-3 sticky-top shadow-sm">
    
    <div class="container-fluid px-4 d-flex justify-content-between align-items-center">

        <a class="navbar-brand fw-bold text-primary" href="../index.html">
            3R LABORAL - BOLSA DE TRABAJO
        </a>
        
        <div class="d-flex align-items-center gap-3">

            <div id="auth-container-reclutador">
                <a href="../login.html" class="btn btn-outline-primary px-3 py-2 fw-bold btn-sm">
                    <i class="fas fa-lock me-1"></i> Reclutador
                </a>
            </div>

            <div id="auth-container">
                <button id="btnGoogle" class="btn btn-danger px-3 py-2 fw-bold btn-sm">
                    <i class="fab fa-google me-2"></i> Iniciar sesión con Google
                </button>
            </div>

        </div>

    </div>

</nav>

<div class="page-container">

    <h2 class="title"><?php echo $titulo; ?></h2>
    <p class="subtitle">3R Laboral - Vacante Confidencial</p>

    <div class="info-grid">
        <div class="info-box">
            <div class="icon">💰</div>
            <div class="info-text"><?php echo $salarioMostrar; ?></div>
        </div>
        <div class="info-box">
            <div class="icon">📍</div>
            <div class="info-text"><?php echo $ubicacion; ?></div>
        </div>
        <div class="info-box">
            <div class="icon">⏱️</div>
            <div class="info-text"><?php echo $jornada; ?></div>
        </div>
    </div>

    <div class="section">
        <h3>Descripción del puesto</h3>
        <div class="desc"><?php echo $descLimpia; ?></div>
    </div>

    <!-- 🔥 BOTÓN POSTULAR -->
    <button id="btnPostular" class="btn-primary">
        <i class="fab fa-google"></i> Inicia sesión para postularte
    </button>

    <div class="actions">
        <button class="btn btn-whatsapp" onclick="compartirWhatsapp()">
            <i class="fab fa-whatsapp"></i> Compartir
        </button>

        <button class="btn btn-copy" onclick="copiarLink()">
            🔗 Copiar link
        </button>
    </div>

</div>



<footer class="footer-corporativo bg-white border-top pt-5 pb-3 mt-5">
    <div class="container">
        <div class="row gy-4">
            <div class="col-lg-4 col-md-6">
                <h5 class="fw-bold text-primary mb-3">3R LABORAL</h5>
                <p class="text-muted small">
                    Expertos en soluciones de capital humano y cumplimiento laboral. Conectando el mejor talento con las mejores oportunidades.
                </p>
                <div class="redes-sociales">
                    <a href="#" class="me-2 text-primary"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" class="me-2 text-primary"><i class="fab fa-linkedin-in"></i></a>
                    <a href="#" class="text-primary"><i class="fas fa-envelope"></i></a>
                </div>
            </div>

            <div class="col-lg-2 col-md-6">
                <h6 class="fw-bold mb-3">Navegación</h6>
                <ul class="list-unstyled small">
                    <li class="mb-2"><a href="index.html" class="text-decoration-none text-muted">Bolsa de Trabajo</a></li>
                    <li class="mb-2"><a href="admin.html" class="text-decoration-none text-muted">Panel Admin</a></li>
                    <li class="mb-2"><a href="#" class="text-decoration-none text-muted">Aviso de Privacidad</a></li>
                </ul>
            </div>

            <div class="col-lg-3 col-md-6">
                <h6 class="fw-bold mb-3">Contacto</h6>
                <ul class="list-unstyled small text-muted">
                    <li class="mb-2"><i class="fas fa-map-marker-alt me-2"></i> Querétaro, México</li>
                    <li class="mb-2"><i class="fas fa-phone me-2"></i> +52 (442) 242 8962</li>
                    <li class="mb-2"><i class="fas fa-clock me-2"></i> Lun - Vie: 9:00 - 18:00</li>
                </ul>
            </div>

            <div class="col-lg-3 col-md-6 text-lg-end">
                <h6 class="fw-bold mb-3">Sistema v2.0</h6>
                <p class="small text-muted">Desarrollado para la gestión eficiente de reclutamiento</p>
                <img src="https://cdn-icons-png.flaticon.com/512/1162/1162933.png" alt="Compliance" width="40" style="opacity: 0.5;">
            </div>
        </div>
        <hr class="my-4 text-muted">
        <div class="row align-items-center">
            <div class="col-md-6 small text-muted">&copy; 2026 3R Laboral. Todos los derechos reservados.</div>
            <div class="col-md-6 text-md-end small">
                <span class="text-muted">Desarrollado con</span> <i class="fas fa-heart text-danger"></i> <span class="text-muted">y Google Gemini</span>
            </div>
        </div>
    </div>
</footer>

<script>
function compartirWhatsapp() {
    const url = window.location.href;
    const mensaje = `Mira esta vacante en 3R Laboral:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}


function copiarLink() {
    const texto = window.location.href;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
            .then(() => alert("Link copiado"))
            .catch(() => copiarFallback(texto));
    } else {
        copiarFallback(texto);
    }
}


function copiarFallback(texto) {
    const input = document.createElement("input");
    input.value = texto;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    alert("Link copiado");
}
</script>


<script type="module">
import { auth, onAuthStateChanged, db, ref, get, child } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';

const containerCandidato = document.getElementById('auth-container');
const containerReclutador = document.getElementById('auth-container-reclutador');

// 🔥 Detectar usuario
onAuthStateChanged(auth, async (user) => {

    if (user) {
        try {
            const snapshot = await get(child(ref(db), `usuarios/${user.uid}`));

            // 🔵 RECLUTADOR
            if (snapshot.exists()) {

                const userData = snapshot.val();
                const nombre = userData.nombre || "Reclutador";

                containerReclutador.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle fw-bold btn-sm" data-bs-toggle="dropdown">
                            <i class="fas fa-user-tie me-1"></i> ${nombre}
                        </button>

                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><a class="dropdown-item" href="../recruit/reclutador.html">Mi Panel</a></li>
                            <li><button class="dropdown-item text-danger" id="logoutRecruit">Cerrar Sesión</button></li>
                        </ul>
                    </div>
                `;

                document.getElementById('logoutRecruit')
                    .addEventListener('click', () => auth.signOut().then(() => location.reload()));

                containerCandidato.style.display = "none";

            } 
            // 🟢 CANDIDATO
            else {

                containerCandidato.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle fw-bold btn-sm" data-bs-toggle="dropdown">
                            <img src="${user.photoURL || ''}" width="25" class="rounded-circle me-1">
                            ${user.displayName?.split(' ')[0] || 'Perfil'}
                        </button>

                        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                            <li><a class="dropdown-item" href="../candidatos/cv-candidato.html">Mi Perfil</a></li>
                            <li><button class="dropdown-item text-danger" id="logoutUser">Cerrar Sesión</button></li>
                        </ul>
                    </div>
                `;

                document.getElementById('logoutUser')
                    .addEventListener('click', () => auth.signOut().then(() => location.reload()));

                containerReclutador.style.display = "none";
            }

        } catch (error) {
            console.error(error);
        }
    }
});

// 🔥 botón login
document.getElementById('btnGoogle')?.addEventListener('click', async () => {
    await loginConGoogle();
    location.reload();
});
</script>


<!-- 🔥 FIREBASE + NAVBAR + POSTULACIÓN -->
<script type="module">
import { auth, db, ref, get, set, push } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const idVacante = "<?php echo $id; ?>";
const btn = document.getElementById('btnPostular');
const authContainer = document.getElementById('authContainer');

let usuarioActual = null;

// 🔥 DETECCIÓN GLOBAL (NAVBAR + POSTULACIÓN)
onAuthStateChanged(auth, async (user) => {

    if (user) {
        usuarioActual = user;

        // ===== NAVBAR =====
        const nombre = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';

        authContainer.innerHTML = `
            <div class="user-menu">
                <button class="user-btn" id="userBtn">
                    <img src="${user.photoURL || 'https://via.placeholder.com/30'}">
                    ${nombre}
                </button>

                <div class="dropdown" id="dropdownMenu">
                    <a href="../candidatos/cv-candidato.html">👤 Mi perfil</a>
                    <a href="../index.html">💼 Ver vacantes</a>
                    <button id="logoutBtn">🚪 Cerrar sesión</button>
                </div>
            </div>
        `;

        document.getElementById('userBtn').onclick = () => {
            const menu = document.getElementById('dropdownMenu');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        };

        document.getElementById('logoutBtn').onclick = async () => {
            await signOut(auth);
            location.reload();
        };

        // ===== BOTÓN POSTULAR =====
        btn.innerHTML = "Postularse";

        const snap = await get(ref(db, 'postulaciones'));
        if (snap.exists()) {
            const yaPostulado = Object.values(snap.val()).some(p =>
                p.uid_candidato === user.uid && p.id_vacante === idVacante
            );

            if (yaPostulado) {
                btn.disabled = true;
                btn.innerText = "Ya te postulaste";
                btn.style.background = "#198754";
            }
        }

    } else {
        // ===== NAVBAR SIN LOGIN =====
        authContainer.innerHTML = `
            <button id="btnLoginNav" class="btn-primary" style="padding:8px 15px;">
                <i class="fab fa-google"></i> Iniciar sesión
            </button>
        `;

        document.getElementById('btnLoginNav').onclick = async () => {
            await loginConGoogle();
            location.reload();
        };
    }

});

// 🔥 CLICK POSTULAR
btn.addEventListener('click', async () => {

    if (!usuarioActual) {
        await loginConGoogle();
        location.reload();
        return;
    }

    btn.disabled = true;
    btn.innerText = "Procesando...";

    try {
        const userSnap = await get(ref(db, `usuarios_candidatos/${usuarioActual.uid}`));
        const datos = userSnap.val();

        if (!datos || datos.perfil_completado === false) {
            alert("Completa tu perfil primero");
            window.location.href = "../perfil-candidato.html";
            return;
        }

        const nuevaPostulacion = {
            ...datos,
            id_vacante: idVacante,
            uid_candidato: usuarioActual.uid,
            fecha_postulacion: new Date().toLocaleString(),
            estado_proceso: "Pendiente"
        };

        await set(push(ref(db, 'postulaciones')), nuevaPostulacion);

        btn.innerText = "Postulación enviada";
        btn.style.background = "#198754";

    } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.innerText = "Postularse";
        alert("Error al postular");
    }

});
</script>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>