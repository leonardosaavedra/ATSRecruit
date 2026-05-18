import { auth, db, ref, get, child, onAuthStateChanged } from './config.js';

onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;

    const isInRecruitFolder = path.includes('/recruit/');
    const isInCpanelFolder  = path.includes('/cpanel/');

    // Ruta de login según carpeta
    const loginPath = isInRecruitFolder ? '../login.html' 
                    : isInCpanelFolder  ? '../login.html' 
                    : 'login.html';

    if (!user) {
        window.location.href = loginPath;
    } else {
        try {
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `usuarios/${user.uid}`));

            if (snapshot.exists()) {
                const rol = snapshot.val().rol;

                if (isInCpanelFolder) {
                    // /cpanel/ → SOLO admin
                    if (rol !== 'admin') {
                        alert("Acceso restringido: Solo administradores.");
                        window.location.href = loginPath;
                    }
                } else if (isInRecruitFolder) {
                    // /recruit/ → admin y reclutador
                    if (rol !== 'admin' && rol !== 'reclutador') {
                        alert("Acceso denegado: No tienes permisos de reclutador.");
                        window.location.href = loginPath;
                    }
                } else {
                    // Raíz → solo admin
                    if (rol !== 'admin') {
                        alert("Acceso restringido: Solo administradores.");
                        window.location.href = loginPath;
                    }
                }

            } else {
                window.location.href = loginPath;
            }
        } catch (error) {
            console.error("Error en el guard:", error);
            window.location.href = loginPath;
        }
    }
});
