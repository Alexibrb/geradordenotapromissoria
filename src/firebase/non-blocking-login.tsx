'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getSdks } from '@/firebase';

type ErrorCallback = (error: FirebaseError) => void;

// --- ATENÇÃO ---
// Altere o e-mail abaixo para o e-mail que você deseja que seja o administrador.
const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

/**
 * Cria ou atualiza o documento do usuário no Firestore, definindo a role e o plano.
 * Garante que usuários admin sempre tenham o plano 'pro'.
 */
const createUserDocument = async (user: User) => {
    const { firestore } = getSdks(user.auth.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const isUserAdmin = user.email === ADMIN_EMAIL;
    const role = isUserAdmin ? 'admin' : 'user';
    const plan = isUserAdmin ? 'pro' : 'free';

    // Se o documento do usuário não existir, cria um novo com todos os campos.
    if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            plan: plan,
            role: role,
            displayName: user.displayName || user.email,
            createdAt: Timestamp.now(), // Salva a data de criação
        });
    } else {
        // Se o documento já existe, garante que a role, o plano e o createdAt estejam corretos.
        const currentData = userDocSnap.data();
        const dataToUpdate: { role: string, plan: string, email?: string, createdAt?: Timestamp } = { 
            role: currentData.role || 'user',
            plan: currentData.plan || 'free',
        };
        
        let needsUpdate = false;

        // Garante que a role de admin esteja correta
        if (isUserAdmin && currentData.role !== 'admin') {
           dataToUpdate.role = 'admin';
           needsUpdate = true;
        }

        // Garante que o plano do admin seja sempre 'pro'
        if (isUserAdmin && currentData.plan !== 'pro') {
            dataToUpdate.plan = 'pro';
            needsUpdate = true;
        }
        
        // Garante que o campo email exista, caso tenha sido um usuário antigo
        if (!currentData.email && user.email) {
            dataToUpdate.email = user.email;
            needsUpdate = true;
        }
        
        // Garante que o campo createdAt exista, caso seja um usuário antigo
        if (!currentData.createdAt) {
            dataToUpdate.createdAt = Timestamp.now();
            needsUpdate = true;
        }

        // Atualiza o documento apenas se houver algo para mudar.
        if (needsUpdate) {
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
      // Garante que o documento do usuário exista e a role/plano estejam corretos ao fazer login.
      createUserDocument(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError(error);
    });
}
