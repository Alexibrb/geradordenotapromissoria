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
        const cpf = sessionStorage.getItem('cpfForSignUp');
        createUserDocument(user, firestore, cpf);
        if (cpf) sessionStorage.removeItem('cpfForSignUp');
    }
  }, [user, firestore, isProfileLoading, userProfile, profileError]);

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
    if (isLoading) {
      return; 
    }

    const isOnAuthPage = pathname === '/login' || pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');
    
    // 1. User is not logged in
    if (!user) {
      if (!isOnAuthPage) {
        router.replace('/login');
      }
      return;
    }

    // 2. User is logged in
    const isAdmin = userProfile?.role === 'admin';

    // Redirect away from auth pages if logged in
    if (isOnAuthPage) {
        if (isAdmin) {
            router.replace('/admin');
        } else {
            router.replace('/clients');
        }
        return;
    }

    // Role-based redirection for authenticated users
    if (adminOnly) { // This route is for admins only
      if (!isAdmin) {
        router.replace('/clients'); // Non-admin tries to access admin page
      }
    } else { // This is a general protected route (not exclusively for admins)
      if (isAdmin && !isAdminPage) {
        router.replace('/admin'); // Admin is on a non-admin page
      }
    }
    

  }, [isLoading, user, userProfile, router, pathname, adminOnly]);

  // While loading, or if conditions for rendering haven't been met, show a loader.
  if (isLoading || (!user && pathname !== '/login' && pathname !== '/') || (user && (pathname === '/login' || pathname === '/'))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render children only if all auth checks have passed and user is on the correct page.
  return <>{children}</>;
}
