import { db, ref, onValue, update } from "./config.js";

// Variable global
let candidatosActuales = [];

document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const idURL = params.get('id');

    if (!idURL) {
        console.error("No se proporcionó un ID de vacante en la URL.");
        return;
    }

    const lista = document.getElementById('listaCandidatosPagina');
    const tituloVacante = document.getElementById('tituloVacante');

    lista.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">
                <div class="spinner-border text-primary"></div> Cargando postulados...
            </td>
        </tr>
    `;

    const postulacionesRef = ref(db, 'postulaciones');

    onValue(postulacionesRef, (snapshot) => {

        const data = snapshot.val();
        lista.innerHTML = "";
        candidatosActuales = [];

        if (data) {
            candidatosActuales = Object.entries(data)
                .filter(([id, c]) => {
                    const idEnDB = String(c.inputID || c.id_vacante || "");
                    return idEnDB.startsWith(idURL);
                })
                .map(([id, c]) => ({ id, ...c }));
        }

        if (candidatosActuales.length === 0) {
            lista.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        No hay candidatos postulados para esta vacante todavía.
                    </td>
                </tr>
            `;
            return;
        }

        if (candidatosActuales[0].puesto_postulado) {
            tituloVacante.innerText = candidatosActuales[0].puesto_postulado;
        }

        candidatosActuales.forEach((c, index) => {

            const nombre = c.nombre || "N/A";
            const whatsapp = c.whatsapp || "";
            const correo = c.correo || "N/A";
            const ubicacion = `${c.municipio || ''}, ${c.estado || ''}`;

            const estado = c.estado_proceso || "Pendiente";
            const colorEstado = getColorEstado(estado);

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

                    <td>
                        <span class="badge bg-${colorEstado}">
                            ${estado}
                        </span>
                    </td>

                    <td class="text-end">
                        <div class="d-flex justify-content-end gap-1 flex-wrap">

                            <button class="btn btn-success btn-sm btn-estado" data-id="${c.id}" data-estado="Interesado">✔</button>
                            <button class="btn btn-warning btn-sm btn-estado" data-id="${c.id}" data-estado="En revisión">?</button>
                            <button class="btn btn-danger btn-sm btn-estado" data-id="${c.id}" data-estado="Descartado">✖</button>

                            <button onclick="verPerfilCandidato(${index})" class="btn btn-dark btn-sm">
                                <i class="fas fa-file-pdf"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        });

    });
});

/* ==========================================
   CAMBIO DE ESTATUS
========================================== */

document.addEventListener('click', async (e) => {

    if (e.target.classList.contains('btn-estado')) {

        const id = e.target.dataset.id;
        const estado = e.target.dataset.estado;

        try {

            const postulacionRef = ref(db, `postulaciones/${id}`);

            await update(postulacionRef, {
                estado_proceso: estado
            });

            const fila = e.target.closest("tr");
            const badge = fila.querySelector(".badge");

            badge.className = `badge bg-${getColorEstado(estado)}`;
            badge.innerText = estado;

            fila.querySelectorAll('.btn-estado').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

        } catch (error) {
            console.error(error);
            alert("Error al actualizar estatus");
        }
    }

});

/* ==========================================
   COLORES ESTATUS
========================================== */

function getColorEstado(estado) {
    switch (estado) {
        case "Interesado": return "success";
        case "Descartado": return "danger";
        case "En revisión": return "warning";
        default: return "secondary";
    }
}

/* ==========================================
   UTILIDAD SEGURA (🔥 FIX REAL)
========================================== */

function valorSeguro(valor) {
    return (valor && valor !== "" && valor !== "null") ? valor : "-";
}

// 🔥 NUEVO: evita que truene si el ID no existe
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valorSeguro(valor);
}

/* ==========================================
   VER PERFIL (MODAL + PDF)
========================================== */

window.verPerfilCandidato = async (index) => {

    const c = candidatosActuales[index];

    if (!c.uid_candidato) {
        console.error("No hay UID del candidato");
        return;
    }

    try {

        const usuarioRef = ref(db, `usuarios_candidatos/${c.uid_candidato}`);

        onValue(usuarioRef, (snapshot) => {

            const data = snapshot.val();

            if (!data) {
                console.error("No se encontró perfil del candidato");
                return;
            }

            const v = (val) => (val && val !== "") ? val : "-";

            // 🔥 DATOS GENERALES (SEGURO)
            setText("pdfNombre", `${v(data.nombre)} ${v(data.apellido)}`);

            setText("pdfUbicacion",
                `${v(data.direccion)}, ${v(data.colonia)}, ${v(data.municipio)}, ${v(data.estado)}, ${v(data.cp)}`
            );

            setText("pdfWhatsApp", data.whatsapp);
            setText("pdfCorreo", data.correo);
            setText("pdfEdad", data.edad);
            setText("pdfSexo", data.sexo);
            setText("pdfCivil", data.estado_civil);

            // EDUCACIÓN
            setText("pdfInstitucion", data.institucion);

            setText("pdfPeriodoEdu",
                (data.edu_inicio || data.edu_fin)
                    ? `${v(data.edu_inicio)} - ${v(data.edu_fin)}`
                    : "-"
            );

            setText("pdfEstadoEdu", data.estado_edu);

            // HABILIDADES
            setText("pdfHabilidades", data.habilidades_desc);

            // DATOS
            setText("pdfLicencia", data.licencia);
            setText("pdfVehiculo", data.vehiculo);
            setText("pdfEscolaridad", data.escolaridad);
            setText("pdfCarrera", data.carrera);

            setText("pdfIdiomas",
                `${v(data.idioma_nombre)} (${v(data.nivel_hablado)} / ${v(data.nivel_escrito)})`
            );

            // DISCAPACIDAD
            setText("pdfDiscapacidad",
                data.tiene_discapacidad === "Si"
                    ? v(data.detalle_discapacidad)
                    : "No"
            );

            // EXPERIENCIA
            const exp = document.getElementById("pdfExperiencia");
            if (exp) {
                exp.innerHTML = `
                    <div class="border-start border-primary ps-3">
                        <h6 class="fw-bold">${valorSeguro(c.exp_puesto1)}</h6>
                        <p class="text-primary small mb-1">${valorSeguro(c.exp_empresa1)}</p>
                        <p class="text-muted small">
                            ${valorSeguro(c.mes_in)} ${valorSeguro(c.anio_in)} - 
                            ${c.actualmente_laborando ? "Actualidad" : `${valorSeguro(c.mes_out)} ${valorSeguro(c.anio_out)}`}
                        </p>
                        <p class="small">${valorSeguro(c.exp_desc1)}</p>
                    </div>
                `;
            }

            // 🔥 MODAL (SIEMPRE ABRE)
            const modalElement = document.getElementById('modalPerfil');
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();

        }, { onlyOnce: true });

    } catch (error) {
        console.error(error);
    }
};