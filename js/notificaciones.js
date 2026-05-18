import { db, auth, ref, get, update, onValue, onAuthStateChanged } from './config.js';

// ============================
// 🔔 SISTEMA DE NOTIFICACIONES
// ============================

let uidUsuario = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    uidUsuario = user.uid;

    // Mostrar nombre en navbar si existe el elemento
    try {
        const snap = await get(ref(db, `usuarios/${user.uid}`));
        if (snap.exists()) {
            const nombre = snap.val().nombre || '';
            const el = document.getElementById('nombreAdminNav') 
                    || document.getElementById('nombreReclutador');
            if (el) el.textContent = nombre;
        }
    } catch(e) {}

    iniciarNotificaciones(user.uid);
});

function iniciarNotificaciones(uid) {
    const btnNotif    = document.getElementById('btnNotificaciones');
    const dropdown    = document.getElementById('dropdownNotif');
    const listaNotif  = document.getElementById('listaNotif');
    const badge       = document.getElementById('badgeNotif');
    const btnMarcar   = document.getElementById('btnMarcarTodas');

    if (!btnNotif || !dropdown || !listaNotif || !badge) return;

    // ── ESCUCHAR NOTIFICACIONES EN TIEMPO REAL ──
    onValue(ref(db, `notificaciones/${uid}`), (snap) => {
        const data = snap.val();

        if (!data) {
            badge.style.display = 'none';
            listaNotif.innerHTML = `
                <div style="padding:32px 20px;text-align:center;color:#aab4c0;">
                    <i class="fas fa-bell-slash" style="font-size:28px;margin-bottom:10px;display:block;"></i>
                    <div style="font-size:13px;">Sin notificaciones</div>
                </div>`;
            return;
        }

        const notifs = Object.entries(data)
            .map(([id, n]) => ({ id, ...n }))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 20);

        const noLeidas = notifs.filter(n => !n.leida).length;

        // Badge
        if (noLeidas > 0) {
            badge.style.display = 'flex';
            badge.textContent = noLeidas > 9 ? '9+' : noLeidas;
        } else {
            badge.style.display = 'none';
        }

        // Lista
        listaNotif.innerHTML = notifs.map(n => `
            <div data-id="${n.id}" data-vacante="${n.id_vacante || ''}" style="
                padding:13px 18px;
                border-bottom:1px solid #F5F7FA;
                display:flex;align-items:flex-start;gap:12px;
                cursor:pointer;transition:background 0.15s;
                background:${n.leida ? 'white' : 'rgba(247,127,0,0.04)'};
            " onmouseover="this.style.background='#F5F7FA'"
               onmouseout="this.style.background='${n.leida ? 'white' : 'rgba(247,127,0,0.04)'}'">
                
                <!-- Ícono -->
                <div style="
                    width:34px;height:34px;border-radius:9px;flex-shrink:0;
                    background:${n.leida ? '#F5F7FA' : 'rgba(247,127,0,0.12)'};
                    display:flex;align-items:center;justify-content:center;
                    color:${n.leida ? '#aab4c0' : '#F77F00'};font-size:14px;
                ">
                    <i class="fas fa-user-plus"></i>
                </div>

                <!-- Texto -->
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:${n.leida ? '500' : '700'};color:#1a1a2e;line-height:1.3;margin-bottom:2px;">
                        ${n.candidato} se postuló
                    </div>
                    <div style="font-size:12px;color:#5a6a7a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${n.vacante}
                    </div>
                    <div style="font-size:11px;color:#aab4c0;margin-top:3px;">
                        <i class="fas fa-clock" style="margin-right:3px;"></i>${n.fecha}
                    </div>
                </div>

                <!-- Punto no leída -->
                ${!n.leida ? `<div style="width:8px;height:8px;border-radius:50%;background:#F77F00;flex-shrink:0;margin-top:4px;"></div>` : ''}
            </div>
        `).join('');

        // Click en notificación → marcar como leída y redirigir
listaNotif.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', async () => {
        await marcarLeida(uid, el.dataset.id);
        const idVacante = el.dataset.vacante;
        if (!idVacante) return;

        const path = window.location.pathname;
        const enAdmin = path.includes('/cpanel/');
        const url = enAdmin
            ? `candidatos.html?id=${idVacante}`
            : `candidatos.html?id=${idVacante}`;

        window.location.href = url;
    });
});
    });

    // ── TOGGLE DROPDOWN ──
    btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        const visible = dropdown.style.display === 'block';
        dropdown.style.display = visible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    dropdown.addEventListener('click', e => e.stopPropagation());

    // ── MARCAR TODAS COMO LEÍDAS ──
    btnMarcar?.addEventListener('click', async () => {
        try {
            const snap = await get(ref(db, `notificaciones/${uid}`));
            if (!snap.exists()) return;
            const updates = {};
            Object.keys(snap.val()).forEach(id => {
                updates[`notificaciones/${uid}/${id}/leida`] = true;
            });
            await update(ref(db), updates);
        } catch(e) { console.error(e); }
    });
}

async function marcarLeida(uid, id) {
    try {
        await update(ref(db, `notificaciones/${uid}/${id}`), { leida: true });
    } catch(e) { console.error(e); }
}