<?php
$id = $_GET['id'] ?? '';

// 🔥 DETECCIÓN AUTOMÁTICA DE DOMINIO
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$urlActual = $protocol . "://" . $host . "/empleo.php?id=" . $id;
$imagen = $protocol . "://" . $host . "/logo.png";

// 🔹 Firebase
$firebaseUrl = "https://r-ats-recruit-default-rtdb.firebaseio.com/vacantes/$id.json";

// 🔥 Obtener datos con control de error
$response = @file_get_contents($firebaseUrl);
$data = $response ? json_decode($response, true) : null;

// Valores seguros
$titulo = htmlspecialchars($data['titulo'] ?? 'Vacante disponible');
$desc = htmlspecialchars($data['desc'] ?? 'Consulta los detalles de esta vacante.');
$ubicacion = htmlspecialchars($data['ubicacion'] ?? 'No especificada');
$salario = htmlspecialchars($data['salario'] ?? 'A tratar');
$requisitos = htmlspecialchars($data['requisitos'] ?? 'No especificados');
$beneficios = htmlspecialchars($data['beneficios'] ?? 'No especificados');

// 🔥 Mensaje para compartir
$mensaje = "Mira esta vacante en 3R Laboral 👇\n" . $urlActual;
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title><?php echo $titulo; ?></title>

<!-- 🔥 Open Graph -->
<meta property="og:title" content="<?php echo $titulo; ?>">
<meta property="og:description" content="<?php echo $desc; ?>">
<meta property="og:type" content="website">
<meta property="og:url" content="<?php echo $urlActual; ?>">
<meta property="og:image" content="<?php echo $imagen; ?>">

<!-- WhatsApp / Twitter -->
<meta name="twitter:card" content="summary_large_image">

<style>
body {
  font-family: Arial;
  background: #f5f5f5;
  padding: 20px;
}
.container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 600px;
  margin: auto;
}
.btn {
  display: inline-block;
  padding: 10px 15px;
  background: #25D366;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}
</style>

</head>
<body>

<div class="container">
  <h1><?php echo $titulo; ?></h1>

  <p><strong>Ubicación:</strong> <?php echo $ubicacion; ?></p>
  <p><strong>Salario:</strong> $<?php echo $salario; ?></p>

  <h3>Descripción</h3>
  <p><?php echo nl2br($desc); ?></p>

  <h3>Requisitos</h3>
  <p><?php echo nl2br($requisitos); ?></p>

  <h3>Beneficios</h3>
  <p><?php echo nl2br($beneficios); ?></p>

  <br>

  <!-- 🔥 BOTÓN WHATSAPP -->
  <a class="btn" target="_blank"
     href="https://wa.me/?text=<?php echo urlencode($mensaje); ?>">
     Compartir en WhatsApp
  </a>

  <br><br>

  <!-- 🔥 BOTÓN COPIAR LINK -->
  <button class="btn" style="background:#6c757d;" onclick="copiarLink()">
    Copiar link
  </button>

</div>

<script>
function copiarLink() {
    navigator.clipboard.writeText("<?php echo $urlActual; ?>");
    alert("Link copiado al portapapeles");
}
</script>

</body>
</html>