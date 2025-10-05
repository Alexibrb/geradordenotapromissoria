'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc } from 'firebase/firestore';

export function useUser() {
  const { user, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const isLoading = isAuthLoading || isProfileLoading;

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Do nothing while loading
    }

    if (!user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // If it's an admin-only route and the user is NOT an admin, redirect
    if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
    }
  }, [isLoading, user, userProfile, adminOnly, router, pathname]);

  // While loading, or if the user is not yet available, show a loader.
  // Also, if it's an admin-only route and we don't have the profile yet, keep loading.
  if (isLoading || !user || (adminOnly && userProfile?.role !== 'admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If all checks pass, render the protected content.
  return <>{children}</>;
}
