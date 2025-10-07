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

type ErrorCallback = (error: FirebaseError) => void;
type SuccessCallback = (user: User) => void;

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, cpf: string, onSuccess: SuccessCallback, onError: ErrorCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
        // Store the CPF in a way that can be retrieved after redirect, e.g., temporary session storage
        sessionStorage.setItem('tempCpfForSignUp', cpf);
        onSuccess(userCredential.user);
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
