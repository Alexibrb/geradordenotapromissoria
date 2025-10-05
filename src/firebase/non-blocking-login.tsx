'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getSdks } from '@/firebase';

type ErrorCallback = (error: FirebaseError) => void;

// --- ATENÇÃO ---
// Altere o e-mail abaixo para o e-mail que você deseja que seja o administrador.
const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

/**
 * Cria ou atualiza o documento do usuário no Firestore, definindo a role.
 */
const createUserDocument = async (user: User) => {
    const { firestore } = getSdks(user.auth.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';

    // Se o documento do usuário não existir, cria um novo com todos os campos.
    if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            plan: 'free', // Plano padrão
            role: role,
            displayName: user.displayName || user.email,
        });
    } else {
        // Se o documento já existe, garante que a role e o email estejam corretos.
        const currentData = userDocSnap.data();
        const dataToUpdate: { role: string, email?: string } = { role: currentData.role || 'user' };

        // Garante que a role de admin esteja correta
        if (user.email === ADMIN_EMAIL && currentData.role !== 'admin') {
           dataToUpdate.role = 'admin';
        }
        
        // Garante que o campo email exista, caso tenha sido um usuário antigo
        if (!currentData.email && user.email) {
            dataToUpdate.email = user.email;
        }

        // Atualiza o documento apenas se houver algo para mudar.
        if (dataToUpdate.role !== currentData.role || dataToUpdate.email) {
             await setDoc(userDocRef, dataToUpdate, { merge: true });
        }
    }
};


/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError: ErrorCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
        // Após o sucesso do registro, cria o documento do usuário.
        createUserDocument(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError(error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError: ErrorCallback): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      // Garante que o documento do usuário exista e a role esteja correta ao fazer login.
      createUserDocument(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError(error);
    });
}
