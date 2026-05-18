<?php

function limpiarHTMLQuill($html) {
    $html = preg_replace('/<span class="ql-ui".*?<\/span>/', '', $html);
    $html = preg_replace('/ contenteditable="false"/', '', $html);
    $html = strip_tags($html, '<p><br><strong><b><ul><ol><li><em><h1><h2>');
    return $html;
}

$id = $_GET['id'] ?? '';

$protocol  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host      = $_SERVER['HTTP_HOST'];
$scriptUrl = $_SERVER['SCRIPT_NAME'];
$urlActual = $protocol . "://" . $host . $scriptUrl . "?id=" . $id;
$imagen    = $protocol . "://" . $host . "/logo.png";

$firebaseUrl = "https://r-ats-recruit-default-rtdb.firebaseio.com/vacantes/$id.json";
$response    = @file_get_contents($firebaseUrl);
$data        = $response ? json_decode($response, true) : null;

$titulo     = htmlspecialchars($data['titulo']    ?? 'Vacante disponible');
$desc       = $data['desc'] ?? '';
$descLimpia = limpiarHTMLQuill($desc);
$ubicacion  = htmlspecialchars($data['ubicacion'] ?? 'No especificada');
$jornada    = htmlspecialchars($data['jornada']   ?? 'No especificada');
$horario    = htmlspecialchars($data['horario']   ?? '');
$direccion  = htmlspecialchars($data['direccion'] ?? '');

$salarioDesde = isset($data['salarioDesde']) ? (int)$data['salarioDesde'] : 0;
$salarioHasta = isset($data['salarioHasta']) ? (int)$data['salarioHasta'] : 0;

function formatearMoneda($valor) {
    return "$" . number_format($valor, 0, '.', ',');
}

if ($salarioDesde && $salarioHasta) {
    $salarioMostrar = formatearMoneda($salarioDesde) . " — " . formatearMoneda($salarioHasta);
} elseif ($salarioDesde) {
    $salarioMostrar = formatearMoneda($salarioDesde);
} else {
    $salarioMostrar = "A tratar";
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo $titulo; ?> | 3R Laboral</title>

<meta property="og:title"       content="<?php echo $titulo; ?>">
<meta property="og:description" content="Vacante disponible en 3R Laboral — <?php echo $ubicacion; ?>">
<meta property="og:type"        content="website">
<meta property="og:url"         content="<?php echo $urlActual; ?>">
<meta property="og:image"       content="<?php echo $imagen; ?>">
<meta name="twitter:card"       content="summary_large_image">

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="empleo.css">
</head>
<body>

<!-- ── HEADER DARK ── -->
<header>
    <div class="header-inner">
        <a href="../index.html" class="logo">
            <div class="logo-icon">3R</div>
            <div>
                <span class="logo-text">3R Laboral</span>
                <span class="logo-sub">Bolsa de Trabajo</span>
            </div>
        </a>
        <div class="header-right">
            <a href="../index.html" class="btn-back">
                <i class="fas fa-arrow-left"></i> Volver a vacantes
            </a>
            <div id="auth-container-reclutador">
                <a href="../login.html" style="text-decoration:none;">
                    <button class="btn-reclutador"><i class="fas fa-lock"></i> Reclutador</button>
                </a>
            </div>
            <div id="auth-container">
                <button id="btnGoogle" class="btn-google">
                    <i class="fab fa-google"></i> Iniciar sesión
                </button>
            </div>
        </div>
    </div>
</header>

<!-- ── CONTENIDO ── -->
<div class="page-wrapper">

    <!-- 1. HEADER VACANTE — título + franja de datos -->
    <div class="vacante-header">
        <div class="vacante-header-top">
            <div class="vacante-badge">
                <i class="fas fa-circle" style="font-size:7px;"></i> Vacante activa
            </div>
            <h1 class="vacante-titulo"><?php echo $titulo; ?></h1>
        </div>

        <!-- Franja de datos -->
        <div class="vacante-datos">
            <div class="vacante-dato salario">
                <div class="vacante-dato-icon"><i class="fas fa-money-bill-wave"></i></div>
                <div>
                    <div class="vacante-dato-label">Salario mensual</div>
                    <div class="vacante-dato-valor"><?php echo $salarioMostrar; ?></div>
                </div>
            </div>
            <div class="vacante-dato">
                <div class="vacante-dato-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div>
                    <div class="vacante-dato-label">Estado</div>
                    <div class="vacante-dato-valor"><?php echo $ubicacion; ?></div>
                </div>
            </div>
            <div class="vacante-dato">
                <div class="vacante-dato-icon"><i class="fas fa-briefcase"></i></div>
                <div>
                    <div class="vacante-dato-label">Jornada</div>
                    <div class="vacante-dato-valor"><?php echo $jornada; ?></div>
                </div>
            </div>
            <?php if ($horario): ?>
            <div class="vacante-dato">
                <div class="vacante-dato-icon"><i class="fas fa-clock"></i></div>
                <div>
                    <div class="vacante-dato-label">Horario</div>
                    <div class="vacante-dato-valor"><?php echo $horario; ?></div>
                </div>
            </div>
            <?php endif; ?>
            <?php if ($direccion): ?>
            <div class="vacante-dato">
                <div class="vacante-dato-icon"><i class="fas fa-building"></i></div>
                <div>
                    <div class="vacante-dato-label">Dirección</div>
                    <div class="vacante-dato-valor"><?php echo $direccion; ?></div>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- 2. DESCRIPCIÓN -->
    <div class="card">
        <div class="card-title">
            <i class="fas fa-align-left"></i> Descripción del puesto
        </div>
        <div class="desc-content">
            <?php echo $descLimpia ?: '<p>Sin descripción disponible.</p>'; ?>
        </div>
    </div>

    <!-- 3. ACCIONES — postular + compartir en una línea -->
    <div class="card-acciones">
        <button id="btnPostular" class="btn-postular">
            <i class="fab fa-google"></i> Inicia sesión para postularte
        </button>
        <div class="compartir-grupo">
            <button class="btn-wa" onclick="compartirWhatsapp()">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn-copy" onclick="copiarLink()">
                <i class="fas fa-link"></i> Copiar link
            </button>
        </div>
    </div>

</div>

<!-- ── FOOTER DARK ── -->
<footer class="footer-completo">
    <div class="footer-inner">
        <div class="footer-grid">
            <div>
                <div class="footer-logo">
                    <div class="logo-icon" style="width:34px;height:34px;font-size:13px;">3R</div>
                    <span style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:white;">3R Laboral</span>
                </div>
                <p class="footer-desc">Expertos en soluciones de capital humano y cumplimiento laboral. Conectando el mejor talento con las mejores oportunidades.</p>
                <div class="footer-social">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-linkedin-in"></i></a>
                    <a href="#"><i class="fas fa-envelope"></i></a>
                </div>
            </div>
            <div>
                <h6 class="footer-col-title">Navegación</h6>
                <ul class="footer-links">
                    <li><a href="../index.html">Bolsa de Trabajo</a></li>
                    <li><a href="https://3rlaboral.com" target="_blank">3R Laboral</a></li>
                    <li><a href="#">Aviso de Privacidad</a></li>
                </ul>
            </div>
            <div>
                <h6 class="footer-col-title">Contacto</h6>
                <ul class="footer-links">
                    <li><i class="fas fa-map-marker-alt"></i> Querétaro, México</li>
                    <li><i class="fas fa-phone"></i> +52 (442) 242 8962</li>
                    <li><i class="fas fa-clock"></i> Lun - Vie: 9:00 - 18:00</li>
                </ul>
            </div>
            <div class="footer-col-end">
                <h6 class="footer-col-title">Sistema v2.0</h6>
                <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">Desarrollado para la gestión eficiente de reclutamiento</p>
                <img src="https://cdn-icons-png.flaticon.com/512/1162/1162933.png" alt="Compliance" width="38" style="opacity:0.4;margin-top:10px;">
            </div>
        </div>
        <div class="footer-bottom">
            <span>© 2026 3R Laboral. Todos los derechos reservados.</span>
            <span>Desarrollado con <i class="fas fa-heart" style="color:#e05555;margin:0 3px;"></i> y Google Gemini</span>
        </div>
    </div>
</footer>

<!-- ── SCRIPTS ── -->
<script>
function compartirWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent('Mira esta vacante en 3R Laboral 👇\n' + window.location.href)}`, '_blank');
}
function copiarLink() {
    const texto = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(mostrarCopiado).catch(() => copiarFallback(texto));
    } else { copiarFallback(texto); }
}
function copiarFallback(texto) {
    const input = document.createElement('input');
    input.value = texto; document.body.appendChild(input);
    input.select(); document.execCommand('copy');
    document.body.removeChild(input); mostrarCopiado();
}
function mostrarCopiado() {
    const btn = document.querySelector('.btn-copy');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
    btn.style.borderColor = '#198754'; btn.style.color = '#198754';
    setTimeout(() => { btn.innerHTML = original; btn.style.borderColor = ''; btn.style.color = ''; }, 2000);
}
</script>

<script type="module">
import { auth, onAuthStateChanged, db, ref, get, child } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';

const containerCandidato  = document.getElementById('auth-container');
const containerReclutador = document.getElementById('auth-container-reclutador');

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
        const snapshot = await get(child(ref(db), `usuarios/${user.uid}`));
        if (snapshot.exists()) {
            const nombre   = snapshot.val().nombre || 'Reclutador';
            const panelUrl = snapshot.val().rol === 'admin' ? '../cpanel/admin.html' : '../recruit/reclutador.html';
            containerReclutador.innerHTML = `
                <div style="position:relative;">
                    <button class="btn-reclutador" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">
                        <i class="fas fa-user-tie"></i> ${nombre}
                    </button>
                    <div class="auth-dropdown">
                        <a href="${panelUrl}">Mi Panel</a>
                        <button class="logout-btn" id="logoutRecruit">Cerrar Sesión</button>
                    </div>
                </div>`;
            document.getElementById('logoutRecruit').addEventListener('click', () => auth.signOut().then(() => location.reload()));
            containerCandidato.style.display = 'none';
        } else {
            const nombre = user.displayName?.split(' ')[0] || 'Perfil';
            containerCandidato.innerHTML = `
                <div style="position:relative;">
                    <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'" style="background:rgba(255,255,255,0.1);color:white;padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.2);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;">
                        <img src="${user.photoURL||''}" width="22" style="border-radius:50%;"> ${nombre}
                    </button>
                    <div class="auth-dropdown">
                        <a href="../candidatos/cv-candidato.html">Mi Perfil</a>
                        <button class="logout-btn" id="logoutUser">Cerrar Sesión</button>
                    </div>
                </div>`;
            document.getElementById('logoutUser').addEventListener('click', () => auth.signOut().then(() => location.reload()));
            containerReclutador.style.display = 'none';
        }
    } catch(e) { console.error(e); }
});

document.getElementById('btnGoogle')?.addEventListener('click', async () => {
    await loginConGoogle(); location.reload();
});
</script>

<script type="module">
import { auth, db, ref, get, set, push } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const idVacante = "<?php echo $id; ?>";
const btn = document.getElementById('btnPostular');
let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioActual = user;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Postularse ahora';
        const snap = await get(ref(db, 'postulaciones'));
        if (snap.exists()) {
            const yaPostulado = Object.values(snap.val()).some(p =>
                p.uid_candidato === user.uid && p.id_vacante === idVacante
            );
            if (yaPostulado) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-check"></i> Ya te postulaste';
                btn.style.background = '#198754';
            }
        }
    }
});

btn.addEventListener('click', async () => {
    if (!usuarioActual) { await loginConGoogle(); location.reload(); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    try {
        const userSnap = await get(ref(db, `usuarios_candidatos/${usuarioActual.uid}`));
        const datos = userSnap.val();
        if (!datos || datos.perfil_completado === false) {
            alert('Completa tu perfil primero');
            window.location.href = '../perfil-candidato.html'; return;
        }
        await set(push(ref(db, 'postulaciones')), {
            ...datos, id_vacante: idVacante,
            uid_candidato: usuarioActual.uid,
            fecha_postulacion: new Date().toLocaleString(),
            estado_proceso: 'Pendiente'
        });
        btn.innerHTML = '<i class="fas fa-check"></i> Postulación enviada';
        btn.style.background = '#198754';
    } catch(e) {
        console.error(e); btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Postularse ahora';
        alert('Error al postular, intenta de nuevo');
    }
});
</script>

</body>
</html>