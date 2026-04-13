import { auth, db, ref, get, child, signInWithEmailAndPassword } from './config.js';

// Función para Login
export async function loginUsuario(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Consultar el rol en la base de datos
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `usuarios/${user.uid}`));

        if (snapshot.exists()) {
            const datos = snapshot.val();
            console.log("Rol detectado:", datos.rol);

            // Redirigir según el rol
            if (datos.rol === 'admin') {
                window.location.href = 'admin.html';
            } else if (datos.rol === 'reclutador') {
                window.location.href = 'recruit/reclutador.html';
            } else {
                await auth.signOut();
                throw new Error("Rol no reconocido");
            }
        } else {
            // Si el usuario existe en Auth pero no tiene nodo en la DB
            await auth.signOut();
            throw new Error("Sin permisos asignados");
        }
    } catch (error) {
        // Re-lanzamos el error para que el login.html lo capture en su catch
        console.error("Error de Auth:", error.message);
        throw error; 
    }
}

// Función para Cerrar Sesión
export function cerrarSesion() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// Hacer cerrarSesion disponible para botones onclick
window.salir = cerrarSesion;