import { db, ref, onValue } from '../js/config.js';
import { sedes } from '../js/data.js';

// ============================
// 📊 ESTADÍSTICAS EN TIEMPO REAL
// ============================

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
});

function cargarEstadisticas() {

    // ── VACANTES ──
    onValue(ref(db, 'vacantes'), (snapVac) => {
        const vacantes = snapVac.val() || {};
        const lista = Object.values(vacantes);

        // Total activas
        const activas = lista.filter(v => v.estado === 'Activa');
        setText('statVacantesActivas', activas.length);

        // Sedes únicas con vacantes activas
        const sedesActivas = new Set(activas.map(v => v.sede).filter(Boolean));
        setText('statSedes', sedesActivas.size || sedes.length);

        // Vacantes activas por sede
        const porSede = document.getElementById('statVacantesPorSede');
        if (porSede) {
            const conteoSedes = {};
            activas.forEach(v => {
                const s = v.sede || 'sin-sede';
                conteoSedes[s] = (conteoSedes[s] || 0) + 1;
            });

            const max = Math.max(...Object.values(conteoSedes), 1);
            const items = sedes.map((s, i) => {
                const count = conteoSedes[s.id] || 0;
                const pct = Math.round((count / max) * 100);
                const medals = ['gold', 'silver', 'bronze'];
                return `
                    <div class="ranking-item">
                        <div class="ranking-num ${medals[i] || ''}">${i + 1}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:5px;">${s.label}</div>
                            <div class="ranking-bar-wrap">
                                <div class="ranking-bar" style="width:${pct}%;"></div>
                            </div>
                        </div>
                        <div class="ranking-count">${count}</div>
                    </div>`;
            }).join('');
            porSede.innerHTML = items || '<p style="color:#aab4c0;font-size:13px;">Sin datos</p>';
        }

        // ── POSTULACIONES (necesita las vacantes para el top) ──
        onValue(ref(db, 'postulaciones'), (snapPost) => {
            const postulaciones = snapPost.val() || {};
            const listaPost = Object.values(postulaciones);

            // Total postulaciones
            setText('statPostulacionesTotal', listaPost.length);

            // Postulaciones esta semana
            const hoy = new Date();
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay());
            inicioSemana.setHours(0, 0, 0, 0);

            const estaSemana = listaPost.filter(p => {
                const fecha = new Date(p.fecha_registro || p.fecha_postulacion || 0);
                return fecha >= inicioSemana;
            }).length;
            setText('statPostulacionesSemana', estaSemana);

            // Top vacantes con más postulados
            const topVacantes = document.getElementById('statTopVacantes');
            if (topVacantes) {
                const conteoPorVacante = {};
                listaPost.forEach(p => {
                    const idV = p.id_vacante || p.inputID;
                    if (!idV) return;
                    conteoPorVacante[idV] = (conteoPorVacante[idV] || 0) + 1;
                });

                const sorted = Object.entries(conteoPorVacante)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                const maxPost = sorted[0]?.[1] || 1;
                const medals = ['gold', 'silver', 'bronze'];

                const items = sorted.map(([idV, count], i) => {
                    const titulo = vacantes[idV]?.titulo || idV.substring(0, 8) + '...';
                    const pct = Math.round((count / maxPost) * 100);
                    return `
                        <div class="ranking-item">
                            <div class="ranking-num ${medals[i] || ''}">${i + 1}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${titulo}</div>
                                <div class="ranking-bar-wrap">
                                    <div class="ranking-bar" style="width:${pct}%;background:linear-gradient(90deg,#F77F00,#ff9f3f);"></div>
                                </div>
                            </div>
                            <div class="ranking-count">${count}</div>
                        </div>`;
                }).join('');
                topVacantes.innerHTML = items || '<p style="color:#aab4c0;font-size:13px;">Sin postulaciones aún</p>';
            }

            // Postulaciones por estado de proceso
            const porEstado = document.getElementById('statPorEstado');
            if (porEstado) {
                const estados = {
                    'Pendiente':   { color: '#6c757d', icon: 'fa-clock' },
                    'En revisión': { color: '#ffc107', icon: 'fa-search' },
                    'Interesado':  { color: '#198754', icon: 'fa-check' },
                    'Descartado':  { color: '#dc3545', icon: 'fa-times' }
                };

                const conteoEstados = {};
                listaPost.forEach(p => {
                    const e = p.estado_proceso || 'Pendiente';
                    conteoEstados[e] = (conteoEstados[e] || 0) + 1;
                });

                const totalPost = listaPost.length || 1;
                const items = Object.entries(estados).map(([nombre, cfg]) => {
                    const count = conteoEstados[nombre] || 0;
                    const pct = Math.round((count / totalPost) * 100);
                    return `
                        <div class="ranking-item">
                            <div class="ranking-num" style="background:${cfg.color}20;color:${cfg.color};">
                                <i class="fas ${cfg.icon}" style="font-size:11px;"></i>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:5px;">${nombre}</div>
                                <div class="ranking-bar-wrap">
                                    <div class="ranking-bar" style="width:${pct}%;background:${cfg.color};"></div>
                                </div>
                            </div>
                            <div class="ranking-count" style="color:${cfg.color};">${count}</div>
                        </div>`;
                }).join('');
                porEstado.innerHTML = items;
            }
        });
    });

    // ── RECLUTADORES CON MÁS ACTIVIDAD ──
    onValue(ref(db, 'usuarios'), (snapUsers) => {
        const usuarios = snapUsers.val() || {};
        const reclutadores = Object.entries(usuarios)
            .filter(([, u]) => u.rol === 'reclutador')
            .map(([uid, u]) => ({ uid, ...u }));

        onValue(ref(db, 'vacantes'), (snapVac) => {
            const vacantes = snapVac.val() || {};

            // Contar vacantes publicadas por reclutador
            // Como las vacantes no tienen uid_reclutador aún, mostramos por sede
            const porSede = {};
            reclutadores.forEach(r => {
                const sedeLabel = r.sede === 'ambas'
                    ? 'Ambas sedes'
                    : sedes.find(s => s.id === r.sede)?.label || r.sede || '—';

                const vacsRec = Object.values(vacantes).filter(v =>
                    v.sede === r.sede || r.sede === 'ambas'
                ).length;

                porSede[r.nombre] = { count: vacsRec, sede: sedeLabel };
            });

            const sorted = Object.entries(porSede)
                .sort((a, b) => b[1].count - a[1].count);

            const maxCount = sorted[0]?.[1].count || 1;
            const medals = ['gold', 'silver', 'bronze'];

            const statRec = document.getElementById('statReclutadores');
            if (statRec) {
                const items = sorted.map(([nombre, data], i) => {
                    const pct = Math.round((data.count / maxCount) * 100);
                    return `
                        <div class="ranking-item">
                            <div class="ranking-num ${medals[i] || ''}">${i + 1}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:13px;font-weight:600;color:#1a1a2e;">${nombre}</div>
                                <div style="font-size:11px;color:#aab4c0;margin-bottom:5px;">${data.sede}</div>
                                <div class="ranking-bar-wrap">
                                    <div class="ranking-bar" style="width:${pct}%;background:linear-gradient(90deg,#6f42c1,#9161d8);"></div>
                                </div>
                            </div>
                            <div class="ranking-count" style="color:#6f42c1;">${data.count}</div>
                        </div>`;
                }).join('');
                statRec.innerHTML = items || '<p style="color:#aab4c0;font-size:13px;">Sin reclutadores registrados</p>';
            }
        });
    });
}

function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}