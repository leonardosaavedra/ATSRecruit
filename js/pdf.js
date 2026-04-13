const PDFGenerator = {
    // Función auxiliar para limpiar el formato de fecha ISO a "Mes Año"
    formatearFecha: function(fecha) {
        if (!fecha) return "N/A";
        // Si la fecha viene como "2022-08-01T05:00:00.000Z"
        if (typeof fecha === 'string' && fecha.includes('T')) {
            const d = new Date(fecha);
            const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            // Usamos UTC para evitar desfases de zona horaria
            return `${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        }
        return fecha; // Si ya es "Enero 2022", lo deja igual
    },

    prepararVistaPrevia: function(datos) {
        // 1. Encabezado y Nombre
        const elNombre = document.getElementById('pdfNombre');
        if (elNombre) {
            elNombre.innerText = (datos.Nombre || "N/A").toUpperCase();
            elNombre.style.fontSize = "22px";
        }

        // 2. Datos de Contacto y Personales
        document.getElementById('pdfWhatsApp').innerText = datos.WhatsApp || "N/A";
        document.getElementById('pdfCorreo').innerText = datos.Correo || "N/A";
        document.getElementById('pdfEdad').innerText = (datos.Edad || "0") + " años";
        document.getElementById('pdfSexo').innerText = datos.Sexo || "N/A";
        document.getElementById('pdfCivil').innerText = datos.Estado_Civil || "N/A";
        
        // 3. Ubicación, Licencia y Vehículo
        document.getElementById('pdfUbicacion').innerText = `${datos.Municipio || ''}, ${datos.Estado || ''}`;
        document.getElementById('pdfLicencia').innerText = datos.Licencia || "Sin licencia";
        document.getElementById('pdfVehiculo').innerText = datos.Vehiculo || "Ninguno";

        // 4. Formación Académica e Idiomas
        document.getElementById('pdfEscolaridad').innerText = datos.Escolaridad || "N/A";
        document.getElementById('pdfCarrera').innerText = datos.Carrera || "N/A";
        document.getElementById('pdfIdiomas').innerText = datos.Idiomas || "No especifica";

        // 5. Discapacidad
        const elDiscapacidad = document.getElementById('pdfDiscapacidad');
        if (elDiscapacidad) {
            const detalle = datos.Discapacidad || "No";
            elDiscapacidad.innerHTML = (detalle !== "No" && detalle !== "Ninguna") 
                ? `<span class="text-danger fw-bold"><i class="fas fa-wheelchair me-1"></i> ${detalle}</span>`
                : "Ninguna";
        }

        // 6. Experiencia Laboral (Limpieza de Fechas)
        const expContainer = document.getElementById('pdfExperiencia');
        if (expContainer) {
            // Limpiamos las fechas antes de mostrarlas
            const fIn = this.formatearFecha(datos.F_ingreso);
            const fOut = (datos.Actualmente_laborando === "Si" || datos.F_salida === "Actualidad") 
                         ? "ACTUALIDAD" 
                         : this.formatearFecha(datos.F_salida);

            const periodo = `${fIn} - ${fOut}`;
            
            expContainer.innerHTML = `
                <div class="border-start border-4 border-primary ps-3 py-2 bg-light mb-3">
                    <h6 class="fw-bold text-dark mb-0">${(datos.Puesto || 'PUESTO NO ESPECIFICADO').toUpperCase()}</h6>
                    <div class="text-primary small fw-bold">${datos.Empresa || 'EMPRESA NO ESPECIFICADA'}</div>
                    <div class="text-muted small mb-2"><i class="far fa-calendar-alt me-1"></i> ${periodo}</div>
                    <p class="small mb-0 text-secondary" style="white-space: pre-wrap; font-style: italic;">
                        ${datos.Experiencia_Descripcion || 'Sin descripción de actividades.'}
                    </p>
                </div>
            `;
        }
    },

    descargarPDF: function() {
        const element = document.getElementById('areaImpresion');
        const nombreDoc = document.getElementById('pdfNombre').innerText;
        const opt = {
            margin: [10, 10],
            filename: `Perfil_${nombreDoc.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }
};

window.PDFGenerator = PDFGenerator;