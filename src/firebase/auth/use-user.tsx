'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

export const createUserDocument = async (user: User, firestore: any, cpf: string) => {
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
                cpf: cpf,
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
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (userProfile && userProfile.plan === 'pro' && userProfile.planExpirationDate) {
        const now = Timestamp.now();
        if (now > userProfile.planExpirationDate) {
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
    // Don't do anything while loading.
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';
    
    // Case 1: User is not logged in.
    if (!user) {
      if (!isAuthPage) {
        router.replace('/login');
      }
      return;
    }
    
    // After this point, user is guaranteed to be logged in.
    
    const isAdmin = userProfile?.role === 'admin';

    // Case 2: Logged-in user is on an auth page.
    if (isAuthPage) {
      router.replace(isAdmin ? '/admin' : '/clients');
      return;
    }

    // Case 3: Non-admin user tries to access an admin-only page.
    if (adminOnly && !isAdmin) {
      router.replace('/clients');
      return;
    }

  }, [isLoading, user, userProfile, router, pathname, adminOnly]);


  // While loading, or if a redirect is imminent, show a full-screen loader.
  if (isLoading || (!user && !(pathname === '/login' || pathname === '/signup' || pathname === '/')) || (user && (pathname === '/login' || pathname === '/signup' || pathname === '/'))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If none of the redirection conditions were met, render the page.
  return <>{children}</>;
}
