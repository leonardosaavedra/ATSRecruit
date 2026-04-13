import { auth, db, ref, get, onAuthStateChanged, signOut, update } from '../js/config.js';

const DEFAULT_PHOTO = 'https://via.placeholder.com/150';

const cargarAnios = () => {
    const anioActual = new Date().getFullYear();
    document.querySelectorAll('.select-anio').forEach(select => {
        for (let i = anioActual; i >= 1970; i--) {
            let opt = document.createElement('option');
            opt.value = i; opt.innerHTML = i; select.appendChild(opt);
        }
    });
};
cargarAnios();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            renderCandidato(data, user);
            fillModals(data, user); 
        }
        
        document.getElementById('userNameNav').innerText = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';
        document.getElementById('userImgNav').src = user.photoURL || DEFAULT_PHOTO;
    } else {
        window.location.href = '../index.html';
    }
});

function renderCandidato(data, user) {
    document.getElementById('lblFoto').src = data.foto || user.photoURL || DEFAULT_PHOTO;
    document.getElementById('lblNombreMain').innerText = `${data.nombre || ''} ${data.apellido || ''}`;
    document.getElementById('lblPuestoPrincipal').innerText = data.exp_puesto1 || 'Postulante';

    // Mapeo dinámico de etiquetas
    Object.keys(data).forEach(key => {
        const elId = `lbl${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const el = document.getElementById(elId);
        if (el) el.innerText = data[key] || '-';
    });

    // Casos específicos de renderizado con tus variables originales
    document.getElementById('lblUbicacionCompleta').innerText = `${data.municipio || ''}, ${data.estado || ''}, México`;
    document.getElementById('lbldireccion').innerText = data.direccion;
    document.getElementById('lblCorreo').innerText = data.correo || user.email;

    const finTexto = data.actualmente_laborando ? 'Presente' : `${data.mes_out || ''} ${data.anio_out || ''}`;
    document.getElementById('lblExp_fin_texto').innerText = finTexto;
}

function fillModals(data, user) {
    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            if (input.type === 'checkbox') input.checked = data[key];
            else input.value = data[key];
        }
    });
    if (document.getElementById('email_readonly')) {
        document.getElementById('email_readonly').value = data.correo || user.email;
    }
}

document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('btn-save')) {
        const btn = e.target;
        const modalId = btn.getAttribute('data-modal');
        const modalEl = document.getElementById(modalId);
        const inputs = modalEl.querySelectorAll('input, select, textarea');
        const user = auth.currentUser;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        let updates = {};
        inputs.forEach(input => {
            if (input.id && input.id !== 'email_readonly') {
                updates[input.id] = (input.type === 'checkbox') ? input.checked : input.value;
            }
        });

        try {
            const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
            await update(userRef, updates);
            bootstrap.Modal.getInstance(modalEl).hide();
            location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
            btn.disabled = false;
            btn.innerText = "Reintentar";
        }
    }
});

document.getElementById('btnCerrarSesion').onclick = () => signOut(auth);