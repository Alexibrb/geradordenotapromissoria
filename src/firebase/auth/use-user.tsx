'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

/**
 * Creates or updates the user document in Firestore upon login or account creation.
 * This ensures the user's role and plan are correctly set.
 */
const createUserDocument = async (user: User, firestore: any) => {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);

        const isUserAdmin = user.email === ADMIN_EMAIL;
        const role = isUserAdmin ? 'admin' : 'user';
        const plan = isUserAdmin ? 'pro' : 'free';

        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                id: user.uid,
                email: user.email,
                plan: plan,
                role: role,
                displayName: user.displayName || user.email,
                createdAt: Timestamp.now(),
            });
        } else {
            const currentData = userDocSnap.data();
            const dataToUpdate: any = {};
            let needsUpdate = false;

            if (isUserAdmin && currentData.role !== 'admin') {
                dataToUpdate.role = 'admin';
                needsUpdate = true;
            }
            if (isUserAdmin && currentData.plan !== 'pro') {
                dataToUpdate.plan = 'pro';
                needsUpdate = true;
            }
            if (!currentData.createdAt) {
                dataToUpdate.createdAt = Timestamp.now();
                needsUpdate = true;
            }

            if (needsUpdate) {
                await setDoc(userDocRef, dataToUpdate, { merge: true });
            }
        }
    } catch (error) {
        console.error("Error creating/updating user document:", error);
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

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  
  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Once user is loaded, ensure their document exists.
    createUserDocument(user, firestore);

    // After ensuring document exists, proceed with role-based redirection.
    // The userProfile might still be loading on the first pass, so we check it.
    if (userProfile) {
        const isAdmin = userProfile.role === 'admin';

        if (adminOnly && !isAdmin) {
          router.replace('/clients');
          return;
        }
        
        if (isAdmin && !pathname.startsWith('/admin')) {
            router.replace('/admin/settings');
            return;
        }

        if (!isAdmin && pathname.startsWith('/admin')) {
            router.replace('/clients');
            return;
        }
    }

  }, [isLoading, user, userProfile, firestore, adminOnly, router, pathname]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = userProfile.role === 'admin';
  
  if (adminOnly && !isAdmin) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isAdmin && !pathname.startsWith('/admin')) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  return <>{children}</>;
}
