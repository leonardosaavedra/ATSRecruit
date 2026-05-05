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
$scriptUrl = $_SERVER['SCRIPT_NAME'];
$urlActual = $protocol . "://" . $host . $scriptUrl . "?id=" . $id;
$imagen = $protocol . "://" . $host . "/logo.png";

// 🔹 Firebase
$firebaseUrl = "https://r-ats-recruit-default-rtdb.firebaseio.com/vacantes/$id.json";
$response = @file_get_contents($firebaseUrl);
$data = $response ? json_decode($response, true) : null;

// 🔥 DATOS
$titulo    = htmlspecialchars($data['titulo']    ?? 'Vacante disponible');
$desc      = $data['desc'] ?? '';
$descLimpia = limpiarHTMLQuill($desc);
$ubicacion = htmlspecialchars($data['ubicacion'] ?? 'No especificada');
$jornada   = htmlspecialchars($data['jornada']   ?? 'No especificada');

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

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<style>
:root {
  --azul: #0D3B66;
  --azul-claro: #185FA5;
  --naranja: #F77F00;
  --naranja-claro: #FF9B26;
  --gris: #F5F7FA;
  --gris-medio: #E8ECF0;
  --texto: #1a1a2e;
  --texto-muted: #5a6a7a;
  --blanco: #FFFFFF;
  --radius: 14px;
  --radius-lg: 22px;
  --sombra: 0 4px 24px rgba(13,59,102,0.10);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--gris); color: var(--texto); }

/* HEADER */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 60px;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--gris-medio);
  box-shadow: 0 2px 16px rgba(13,59,102,0.06);
}
.logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.logo-icon {
  width: 36px; height: 36px;
  background: var(--azul);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 14px; letter-spacing: -1px;
}
.logo-text { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--azul); }
.logo-sub { font-size: 10px; color: var(--texto-muted); text-transform: uppercase; letter-spacing: 1.5px; display: block; line-height: 1; }

.header-right { display: flex; align-items: center; gap: 10px; }
.btn-back {
  display: flex; align-items: center; gap: 7px;
  color: var(--texto-muted);
  text-decoration: none;
  font-size: 14px; font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--gris-medio);
  transition: all 0.2s;
}
.btn-back:hover { color: var(--azul); border-color: var(--azul); background: var(--gris); }

/* AUTH CONTAINERS */
#auth-container-reclutador .btn-reclutador,
#auth-container .btn-google {
  padding: 8px 16px; border-radius: 9px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; border: none;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
}
#auth-container-reclutador .btn-reclutador {
  border: 1.5px solid var(--azul); background: transparent; color: var(--azul);
}
#auth-container-reclutador .btn-reclutador:hover { background: var(--azul); color: white; }
#auth-container .btn-google { background: #EA4335; color: white; }
#auth-container .btn-google:hover { background: #c5352a; }

/* LAYOUT PRINCIPAL */
.page-wrapper {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px 80px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
  align-items: start;
}

/* COLUMNA IZQUIERDA */
.main-col {}

/* CARD CABECERA VACANTE */
.vacante-header {
  background: var(--azul);
  border-radius: var(--radius-lg);
  padding: 36px 36px 32px;
  margin-bottom: 22px;
  position: relative;
  overflow: hidden;
}
.vacante-header::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 260px; height: 260px;
  background: radial-gradient(circle, rgba(247,127,0,0.18) 0%, transparent 70%);
  pointer-events: none;
}
.vacante-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(247,127,0,0.2);
  border: 1px solid rgba(247,127,0,0.4);
  color: #FFB347;
  padding: 4px 12px; border-radius: 20px;
  font-size: 11.5px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 16px;
}
.vacante-titulo {
  font-family: 'Playfair Display', serif;
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 700;
  color: white;
  line-height: 1.2;
  margin-bottom: 20px;
}
.vacante-meta { display: flex; flex-wrap: wrap; gap: 14px; }
.meta-item {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.75);
  font-size: 14px;
}
.meta-item i { color: var(--naranja); font-size: 13px; }

/* CARD DESCRIPCIÓN */
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 32px;
  margin-bottom: 22px;
  border: 1px solid var(--gris-medio);
  box-shadow: var(--sombra);
}
.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 700;
  color: var(--azul);
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gris-medio);
  display: flex; align-items: center; gap: 10px;
}
.card-title i { color: var(--naranja); font-size: 16px; }

.desc-content { font-size: 15px; color: var(--texto); line-height: 1.75; }
.desc-content p { margin-bottom: 12px; }
.desc-content ul, .desc-content ol { padding-left: 20px; margin-bottom: 12px; }
.desc-content li { margin-bottom: 6px; }
.desc-content strong { color: var(--azul); }

/* COLUMNA DERECHA — SIDEBAR */
.sidebar {}

.sidebar-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 28px;
  border: 1px solid var(--gris-medio);
  box-shadow: var(--sombra);
  margin-bottom: 18px;
  position: sticky;
  top: 90px;
}
.sidebar-title {
  font-size: 13px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--texto-muted);
  margin-bottom: 20px;
}

/* DATOS RESUMEN SIDEBAR */
.dato-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--gris-medio);
}
.dato-item:last-of-type { border-bottom: none; }
.dato-icon {
  width: 36px; height: 36px; min-width: 36px;
  background: var(--gris);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
}
.dato-label { font-size: 11.5px; color: var(--texto-muted); margin-bottom: 2px; }
.dato-valor { font-size: 14px; font-weight: 600; color: var(--texto); }

/* BOTÓN POSTULAR */
.btn-postular {
  width: 100%;
  padding: 15px;
  background: var(--azul);
  color: white;
  border: none;
  border-radius: 11px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.25s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-postular:hover { background: var(--azul-claro); transform: translateY(-1px); }
.btn-postular:disabled { background: #198754; cursor: not-allowed; transform: none; }

/* BOTONES COMPARTIR */
.compartir-titulo {
  font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.2px;
  color: var(--texto-muted);
  margin: 20px 0 12px;
}
.compartir-btns { display: flex; gap: 10px; }
.btn-wa {
  flex: 1;
  padding: 11px;
  background: #25D366;
  color: white;
  border: none; border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: all 0.2s;
}
.btn-wa:hover { background: #1ebe5d; transform: translateY(-1px); }
.btn-copy {
  flex: 1;
  padding: 11px;
  background: transparent;
  color: var(--texto-muted);
  border: 1.5px solid var(--gris-medio);
  border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: all 0.2s;
}
.btn-copy:hover { border-color: var(--azul); color: var(--azul); background: var(--gris); }

/* FOOTER */
footer {
  background: #07233d;
  color: rgba(255,255,255,0.55);
  padding: 24px 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
footer a { color: rgba(255,255,255,0.55); text-decoration: none; }
footer a:hover { color: white; }

/* RESPONSIVE */
@media(max-width: 768px) {
  header { padding: 14px 20px; }
  .page-wrapper { grid-template-columns: 1fr; padding: 0 16px 60px; margin-top: 24px; gap: 18px; }
  .vacante-header { padding: 26px 22px; }
  .card { padding: 22px; }
  .sidebar-card { position: static; }
  footer { flex-direction: column; gap: 10px; text-align: center; padding: 20px; }
}
</style>
</head>
<body>

<!-- HEADER -->
<header>
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
        <button class="btn-reclutador">
          <i class="fas fa-lock"></i> Reclutador
        </button>
      </a>
    </div>

    <div id="auth-container">
      <button id="btnGoogle" class="btn-google">
        <i class="fab fa-google"></i> Iniciar sesión
      </button>
    </div>
  </div>
</header>

<!-- CONTENIDO -->
<div class="page-wrapper">

  <!-- COLUMNA PRINCIPAL -->
  <div class="main-col">

    <!-- CABECERA VACANTE -->
    <div class="vacante-header">
      <div class="vacante-badge">
        <i class="fas fa-circle" style="font-size:7px;"></i> Vacante activa
      </div>
      <h1 class="vacante-titulo"><?php echo $titulo; ?></h1>
      <div class="vacante-meta">
        <div class="meta-item"><i class="fas fa-map-marker-alt"></i><?php echo $ubicacion; ?></div>
        <div class="meta-item"><i class="fas fa-briefcase"></i><?php echo $jornada; ?></div>
        <div class="meta-item"><i class="fas fa-money-bill-wave"></i><?php echo $salarioMostrar; ?> mensual</div>
      </div>
    </div>

    <!-- DESCRIPCIÓN -->
    <div class="card">
      <div class="card-title">
        <i class="fas fa-align-left"></i> Descripción del puesto
      </div>
      <div class="desc-content">
        <?php echo $descLimpia ?: '<p>Sin descripción disponible.</p>'; ?>
      </div>
    </div>

  </div>

  <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="sidebar-card">
      <div class="sidebar-title">Detalles de la vacante</div>

      <div class="dato-item">
        <div class="dato-icon">💰</div>
        <div>
          <div class="dato-label">Salario mensual</div>
          <div class="dato-valor"><?php echo $salarioMostrar; ?></div>
        </div>
      </div>

      <div class="dato-item">
        <div class="dato-icon">📍</div>
        <div>
          <div class="dato-label">Ubicación</div>
          <div class="dato-valor"><?php echo $ubicacion; ?></div>
        </div>
      </div>

      <div class="dato-item">
        <div class="dato-icon">⏱️</div>
        <div>
          <div class="dato-label">Jornada</div>
          <div class="dato-valor"><?php echo $jornada; ?></div>
        </div>
      </div>

      <!-- BOTÓN POSTULAR -->
      <button id="btnPostular" class="btn-postular" style="margin-top:22px;">
        <i class="fab fa-google"></i> Inicia sesión para postularte
      </button>

      <!-- COMPARTIR -->
      <div class="compartir-titulo">Compartir vacante</div>
      <div class="compartir-btns">
        <button class="btn-wa" onclick="compartirWhatsapp()">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </button>
        <button class="btn-copy" onclick="copiarLink()">
          <i class="fas fa-link"></i> Copiar link
        </button>
      </div>

    </div>
  </div>

</div>

<!-- FOOTER -->
<footer>
  <span>© 2026 3R Laboral — Todos los derechos reservados</span>
  <div style="display:flex;gap:20px;">
    <a href="../index.html">Bolsa de trabajo</a>
    <a href="https://3rlaboral.com" target="_blank">3rlaboral.com</a>
    <a href="#">Aviso de privacidad</a>
  </div>
</footer>

<!-- SCRIPTS -->
<script>
function compartirWhatsapp() {
  const url = window.location.href;
  const mensaje = `Mira esta vacante en 3R Laboral 👇\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function copiarLink() {
  const texto = window.location.href;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarCopiado())
      .catch(() => copiarFallback(texto));
  } else {
    copiarFallback(texto);
  }
}

function copiarFallback(texto) {
  const input = document.createElement('input');
  input.value = texto;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  mostrarCopiado();
}

function mostrarCopiado() {
  const btn = document.querySelector('.btn-copy');
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
  btn.style.borderColor = '#198754';
  btn.style.color = '#198754';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.borderColor = '';
    btn.style.color = '';
  }, 2000);
}
</script>

<script type="module">
import { auth, onAuthStateChanged, db, ref, get, child } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';

const containerCandidato   = document.getElementById('auth-container');
const containerReclutador  = document.getElementById('auth-container-reclutador');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snapshot = await get(child(ref(db), `usuarios/${user.uid}`));

      if (snapshot.exists()) {
        const nombre = snapshot.val().nombre || 'Reclutador';
        containerReclutador.innerHTML = `
          <div style="position:relative;">
            <button class="btn-reclutador" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'" style="border:1.5px solid #0D3B66;background:transparent;color:#0D3B66;padding:8px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-user-tie"></i> ${nombre}
            </button>
            <div style="display:none;position:absolute;right:0;top:44px;background:white;border:1px solid #E8ECF0;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.12);min-width:160px;overflow:hidden;z-index:100;">
              <a href="../recruit/reclutador.html" style="display:block;padding:11px 16px;text-decoration:none;color:#1a1a2e;font-size:13.5px;border-bottom:1px solid #F5F7FA;">Mi Panel</a>
              <button id="logoutRecruit" style="width:100%;padding:11px 16px;text-align:left;background:none;border:none;color:#dc3545;font-size:13.5px;cursor:pointer;">Cerrar Sesión</button>
            </div>
          </div>`;
        document.getElementById('logoutRecruit')
          .addEventListener('click', () => auth.signOut().then(() => location.reload()));
        containerCandidato.style.display = 'none';

      } else {
        const nombre = user.displayName?.split(' ')[0] || 'Perfil';
        containerCandidato.innerHTML = `
          <div style="position:relative;">
            <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'" style="background:#0D3B66;color:white;padding:8px 14px;border-radius:9px;border:none;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;">
              <img src="${user.photoURL||''}" width="22" style="border-radius:50%;"> ${nombre}
            </button>
            <div style="display:none;position:absolute;right:0;top:44px;background:white;border:1px solid #E8ECF0;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.12);min-width:160px;overflow:hidden;z-index:100;">
              <a href="../candidatos/cv-candidato.html" style="display:block;padding:11px 16px;text-decoration:none;color:#1a1a2e;font-size:13.5px;border-bottom:1px solid #F5F7FA;">Mi Perfil</a>
              <button id="logoutUser" style="width:100%;padding:11px 16px;text-align:left;background:none;border:none;color:#dc3545;font-size:13.5px;cursor:pointer;">Cerrar Sesión</button>
            </div>
          </div>`;
        document.getElementById('logoutUser')
          .addEventListener('click', () => auth.signOut().then(() => location.reload()));
        containerReclutador.style.display = 'none';
      }

    } catch(e) { console.error(e); }
  }
});

document.getElementById('btnGoogle')?.addEventListener('click', async () => {
  await loginConGoogle();
  location.reload();
});
</script>

<script type="module">
import { auth, db, ref, get, set, push } from '../js/config.js';
import { loginConGoogle } from '../js/auth-candidatos.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
      }
    }
  }
});

btn.addEventListener('click', async () => {
  if (!usuarioActual) {
    await loginConGoogle();
    location.reload();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

  try {
    const userSnap = await get(ref(db, `usuarios_candidatos/${usuarioActual.uid}`));
    const datos = userSnap.val();

    if (!datos || datos.perfil_completado === false) {
      alert('Completa tu perfil primero');
      window.location.href = '../perfil-candidato.html';
      return;
    }

    await set(push(ref(db, 'postulaciones')), {
      ...datos,
      id_vacante: idVacante,
      uid_candidato: usuarioActual.uid,
      fecha_postulacion: new Date().toLocaleString(),
      estado_proceso: 'Pendiente'
    });

    btn.innerHTML = '<i class="fas fa-check"></i> Postulación enviada';

  } catch(e) {
    console.error(e);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Postularse ahora';
    alert('Error al postular, intenta de nuevo');
  }
});
</script>

</body>
</html>