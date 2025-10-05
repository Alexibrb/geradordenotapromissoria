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

const createUserDocument = async (user: User, firestore: any) => {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            const isUserAdmin = user.email === ADMIN_EMAIL;
            const role = isUserAdmin ? 'admin' : 'user';
            const plan = isUserAdmin ? 'pro' : 'free';

            await setDoc(userDocRef, {
                id: user.uid,
                email: user.email,
                plan: plan,
                role: role,
                displayName: user.displayName || user.email,
                createdAt: Timestamp.now(),
            });
        }
    } catch (error) {
        console.error("Error creating user document:", error);
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
  const firestore = useFirestore();
  
  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    createUserDocument(user, firestore);

    if (userProfile) {
        const isAdmin = userProfile.role === 'admin';

        if (adminOnly && !isAdmin) {
          router.replace('/');
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

  if (isLoading || !user || !userProfile) {
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
             <p>Redirecionando...</p>
        </div>
    );
  }

  if (isAdmin && !pathname.startsWith('/admin')) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <p>Redirecionando para o painel de administração...</p>
        </div>
      );
  }
  
  return <>{children}</>;
}

    