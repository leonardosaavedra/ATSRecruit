import { auth, googleProvider, signInWithPopup, db, ref, set, get } from "./config.js";

export const loginConGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Referencia al posible perfil del candidato en la base de datos
        const userRef = ref(db, `usuarios_candidatos/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            // SI ES NUEVO: Creamos su perfil básico
            await set(userRef, {
                nombre: user.displayName,
                correo: user.email,
                foto: user.photoURL,
                perfil_completado: false, // Flag para saber si le faltan datos
                fecha_registro: new Date().toISOString()
            });
            console.log("Nuevo candidato registrado");
        } else {
            console.log("Candidato existente, bienvenido de nuevo");
        }

        return user; // Retornamos el usuario para redirigir
    } catch (error) {
        console.error("Error al entrar con Google:", error);
        throw error;
    }
};