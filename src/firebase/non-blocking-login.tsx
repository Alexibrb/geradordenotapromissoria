'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { getSdks } from '@/firebase'; // Assumindo que getSdks está disponível para obter firestore

type ErrorCallback = (error: FirebaseError) => void;

/**
 * Cria o documento do usuário no Firestore, definindo a role.
 * O primeiro usuário registrado será 'admin', os demais 'user'.
 */
const createUserDocument = async (user: User) => {
    const { firestore } = getSdks(user.auth.app);
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        // Verifica se é o primeiro usuário do sistema
        const usersCollectionRef = collection(firestore, 'users');
        const q = query(usersCollectionRef, limit(1));
        const existingUsersSnap = await getDocs(q);
        
        const role = existingUsersSnap.empty ? 'admin' : 'user';

        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            plan: 'free', // Plano padrão
            role: role,
            displayName: user.displayName || user.email,
        });
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
    .catch((error: FirebaseError) => {
        onError(error);
    });
}
