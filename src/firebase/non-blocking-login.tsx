'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth, // Import Auth type for type hinting
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

type ErrorCallback = (error: FirebaseError) => void;

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError: ErrorCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
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
