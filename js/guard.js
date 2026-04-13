import { auth, db, ref, get, child, onAuthStateChanged } from './config.js';

onAuthStateChanged(auth, async (user) => {
    // Detectamos si estamos dentro de la carpeta recruit para ajustar las rutas
    const isInRecruitFolder = window.location.pathname.includes('/recruit/');
    const loginPath = isInRecruitFolder ? '../login.html' : 'login.html';

    if (!user) {
        // Si no hay sesión, rebota al login usando la ruta ajustada
        window.location.href = loginPath;
    } else {
        try {
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `usuarios/${user.uid}`));
            
            if (snapshot.exists()) {
                const rol = snapshot.val().rol;

                // LÓGICA DE PROTECCIÓN POR RUTA
                if (isInRecruitFolder) {
                    // En la carpeta RECRUIT: Entran admin y reclutador
                    if (rol !== 'admin' && rol !== 'reclutador') {
                        alert("Acceso denegado: No tienes permisos de reclutador.");
                        window.location.href = loginPath;
                    }
                } else {
                    // En la raíz (admin.html): SOLO entra el admin
                    if (rol !== 'admin') {
                        alert("Acceso restringido: Solo administradores.");
                        window.location.href = loginPath;
                    }
                }
                
                // Si pasa las validaciones, el código no hace nada y deja cargar la página.
                
            } else {
                window.location.href = loginPath;
            }
        } catch (error) {
            console.error("Error en el guard:", error);
            window.location.href = loginPath;
        }
    }
});


/*


import { auth, db, ref, get, child, onAuthStateChanged } from './config.js';

// Este código corre en cuanto carga la página
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Si no hay sesión iniciada, rebota al login
        window.location.href = 'login.html';
    } else {
        // Si hay sesión, verificamos en la DB si es admin
        try {
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, `usuarios/${user.uid}`));
            
            if (snapshot.exists()) {
                const rol = snapshot.val().rol;
                if (rol !== 'admin') {
                    alert("Acceso restringido: Solo administradores.");
                    window.location.href = 'login.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            window.location.href = 'login.html';
        }
    }
});


*/