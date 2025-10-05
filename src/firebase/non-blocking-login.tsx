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
const ADMIN_EMAIL = 'admin@example.com';

/**
 * Cria ou atualiza o documento do usuário no Firestore, definindo a role.
 */
const createUserDocument = async (user: User) => {
    const { firestore } = getSdks(user.auth.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Se o documento do usuário não existir, cria um novo.
    if (!userDocSnap.exists()) {
        const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';

        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            plan: 'free', // Plano padrão
            role: role,
            displayName: user.displayName || user.email,
        });
    } else {
        // Se o documento já existe, apenas verifica se o e-mail corresponde ao admin
        // e atualiza a role se necessário. Isso garante que o admin sempre terá a role correta.
        const currentData = userDocSnap.data();
        if (user.email === ADMIN_EMAIL && currentData.role !== 'admin') {
           await setDoc(userDocRef, { role: 'admin' }, { merge: true });
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
