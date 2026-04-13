import { db, ref, onValue } from "./config.js";

// Variable para guardar los candidatos y usarlos en el modal de PDF
let candidatosActuales = [];

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idURL = params.get('id'); // Este es el ID corto o largo de la URL

    if (!idURL) {
        console.error("No se proporcionó un ID de vacante en la URL.");
        return;
    }

    const lista = document.getElementById('listaCandidatosPagina');
    const tituloVacante = document.getElementById('tituloVacante');

    // Mostrar estado de carga
    lista.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div> Cargando postulados...</td></tr>';

    // Escuchar la rama 'postulaciones' en Firebase
    const postulacionesRef = ref(db, 'postulaciones');

    onValue(postulacionesRef, (snapshot) => {
        const data = snapshot.val();
        lista.innerHTML = "";
        candidatosActuales = [];

        if (data) {
            // Filtramos las postulaciones que coincidan con el ID de la URL
            // Usamos .startsWith() para que el ID corto (-OpEYR) encuentre al largo
            candidatosActuales = Object.values(data).filter(c => {
                const idEnDB = String(c.inputID || c.id_vacante || "");
                return idEnDB.startsWith(idURL);
            });
        }

        if (candidatosActuales.length === 0) {
            lista.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay candidatos postulados para esta vacante todavía.</td></tr>';
            return;
        }

        // Si hay candidatos, intentamos poner el nombre del puesto en el título principal
        if (candidatosActuales[0].puesto_postulado) {
            tituloVacante.innerText = candidatosActuales[0].puesto_postulado;
        }

        // Renderizar la tabla
        candidatosActuales.forEach((c, index) => {
            // Ajuste de nombres de campos según lo que envía public-logic.js
            const nombre = c.nombre || c.Nombre || "N/A";
            const whatsapp = c.whatsapp || c.WhatsApp || "";
            const correo = c.correo || c.Correo || "N/A";
            const ubicacion = `${c.municipio || ''}, ${c.estado || ''}`;

            const whatsappLink = `
                <a href="https://wa.me/${whatsapp}" target="_blank" class="text-success text-decoration-none fw-bold">
                    <i class="fab fa-whatsapp"></i> ${whatsapp}
                </a>`;

            lista.innerHTML += `
                <tr>
                    <td><div class="fw-bold text-dark">${nombre}</div></td>
                    <td>${ubicacion}</td>
                    <td>${whatsappLink}</td>
                    <td><small class="text-muted">${correo}</small></td>
                    <td class="text-end">
                        <button onclick="verPerfilCandidato(${index})" class="btn btn-sm btn-dark shadow-sm">
                            <i class="fas fa-file-pdf"></i> Ver Perfil
                        </button>
                    </td>
                </tr>`;
        });
    });
});

window.verPerfilCandidato = (index) => {
    const c = candidatosActuales[index];
    
    // Mapeo de campos: de lo que hay en Firebase -> a lo que pide tu pdf.js
    const datosParaPDF = {
        // Personales
        Nombre: c.nombre || "N/A",
        WhatsApp: c.whatsapp || "N/A",
        Correo: c.correo || "N/A",
        Edad: c.edad || "0",
        Sexo: c.sexo || "N/A",
        Estado_Civil: c.estado_civil || "N/A",
        
        // Ubicación y Extras
        Municipio: c.municipio || "",
        Estado: c.estado || "",
        Licencia: c.licencia || "Sin licencia",
        Vehiculo: c.vehiculo || "Ninguno",

        // Académico
        Escolaridad: c.escolaridad || "N/A",
        Carrera: c.carrera || "N/A",
        Idiomas: `${c.idioma_nombre || ''} - ${c.idioma_nivel || ''}`,

        // Discapacidad
        Discapacidad: c.detalle_discapacidad || "No",

        // Experiencia Laboral (Nombres exactos que pide tu pdf.js)
        Puesto: c.exp_puesto1 || "PUESTO NO ESPECIFICADO",
        Empresa: c.exp_empresa1 || "EMPRESA NO ESPECIFICADA",
        Experiencia_Descripcion: c.exp_desc1 || "Sin descripción de actividades.",
        
        // Manejo de fechas para el formato de pdf.js
        F_ingreso: `${c.mes_in} ${c.anio_in}`,
        F_salida: c.actualmente_laborando === "on" ? "Actualidad" : `${c.mes_out} ${c.anio_out}`,
        Actualmente_laborando: c.actualmente_laborando === "on" ? "Si" : "No"
    };

    console.log("Enviando datos al generador:", datosParaPDF);

    if (window.PDFGenerator) {
        // Llamamos a la función de tu archivo pdf.js
        window.PDFGenerator.prepararVistaPrevia(datosParaPDF);
        
        // Mostramos el modal
        const modalElement = document.getElementById('modalPerfil');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error("No se encontró el objeto PDFGenerator. Revisa que pdf.js esté cargado.");
    }
};