'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

export const createUserDocument = async (user: User, firestore: any, cpf?: string | null) => {
    if (!user || !firestore) return null;

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            const isUserAdmin = user.email === ADMIN_EMAIL;
            const role = isUserAdmin ? 'admin' : 'user';
            const plan = isUserAdmin ? 'pro' : 'free';

            const newUser: Omit<AppUser, 'id'> = {
                email: user.email!,
                cpf: cpf || undefined,
                plan: plan,
                role: role,
                displayName: user.displayName || user.email,
                createdAt: Timestamp.now(),
            };

            await setDoc(userDocRef, newUser);
            return { id: user.uid, ...newUser } as AppUser;
        } else {
             return { id: userDocSnap.id, ...userDocSnap.data() } as AppUser;
        }
    } catch (error) {
        console.error("Error creating or getting user document:", error);
        return null;
    }
};

export function useUser() {
  const { user, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (user && firestore && !isProfileLoading && !userProfile && !profileError) {
        // This effect is a fallback. The primary user creation path is now initiateEmailSignUp.
        // It handles cases where a user might exist in Auth but not in Firestore for any reason.
        createUserDocument(user, firestore);
    }
  }, [user, firestore, isProfileLoading, userProfile, profileError]);

  useEffect(() => {
    if (userProfile && userProfile.plan === 'pro' && userProfile.planExpirationDate) {
        const now = Timestamp.now();
        if (now > userProfile.planExpirationDate) {
            // Plan expired, downgrade to free
            const userDocRef = doc(firestore, 'users', userProfile.id);
            setDocumentNonBlocking(userDocRef, { plan: 'free' }, { merge: true });
        }
    }
  }, [userProfile, firestore]);

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (!user) {
      if (pathname !== '/login' && pathname !== '/') {
        router.replace('/login');
      }
      return;
    }
    
    // User is authenticated
    if (userProfile) {
        const isAdmin = userProfile.role === 'admin';

        if (adminOnly && !isAdmin) {
          router.replace('/clients'); // Redirect non-admins from admin area
          return;
        }
        
        // Redirect a logged-in user away from login or landing
        if (pathname === '/login' || pathname === '/') {
            if (isAdmin) {
                router.replace('/admin');
            } else {
                router.replace('/clients');
            }
            return;
        }

        if (isAdmin && !pathname.startsWith('/admin')) {
            router.replace('/admin');
            return;
        }

        if (!isAdmin && pathname.startsWith('/admin')) {
            router.replace('/clients');
            return;
        }
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not logged in and is on a public page (login or landing), show the page.
  if (!user && (pathname === '/login' || pathname === '/')) {
      return <>{children}</>;
  }
  
  // If user is not logged in and trying to access a protected page, show loader while redirecting.
  if (!user) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // If user is logged in, but profile is still loading, show a loader.
  if (!userProfile) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-2">Carregando perfil...</p>
      </div>
    );
  }
  
  const isAdmin = userProfile.role === 'admin';
  
  if (adminOnly && !isAdmin) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
             <p>Redirecionando...</p>
        </div>
    );
  }

  // If a logged-in user is on the login/landing page, show loader while redirecting.
  if (pathname === '/login' || pathname === '/') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  return <>{children}</>;
}
