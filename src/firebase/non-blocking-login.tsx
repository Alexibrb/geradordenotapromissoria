'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  User,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { createUserDocument } from './auth/use-user';


type ErrorCallback = (error: FirebaseError) => void;
type SuccessCallback = (user: User) => void;

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, cpf: string, onSuccess: SuccessCallback, onError: ErrorCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
        // After creating the user in Auth, create their document in Firestore.
        const firestore = getFirestore(authInstance.app);
        const userProfile = await createUserDocument(userCredential.user, firestore, cpf);
        
        if (userProfile) {
            onSuccess(userCredential.user);
        } else {
            // This case is unlikely but handles failure in creating the Firestore doc.
            const error = new FirebaseError('auth/internal-error', 'Failed to create user profile in database.');
            onError(error);
        }
    })
    .catch((error: FirebaseError) => {
        onError(error);
    });
}


/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onSuccess: SuccessCallback, onError: ErrorCallback): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      onSuccess(userCredential.user);
    })
    .catch((error: FirebaseError) => {
        onError(error);
    });
}

/** Initiate password reset email (non-blocking). */
export function initiatePasswordReset(authInstance: Auth, email: string, onSuccess: () => void, onError: ErrorCallback): void {
    sendPasswordResetEmail(authInstance, email)
        .then(() => {
            onSuccess();
        })
        .catch((error: FirebaseError) => {
            onError(error);
        });
}
