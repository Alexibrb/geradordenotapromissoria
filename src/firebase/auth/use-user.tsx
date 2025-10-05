'use client';
import { useEffect, useState } from 'react';
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

  // A loading state is true if auth is loading, or if we have a user but are still fetching their profile.
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

    // If no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }

    const isAdmin = userProfile?.role === 'admin';

    // If admin-only route and user is not admin, redirect.
    if (adminOnly && !isAdmin) {
      router.replace('/clients');
      return;
    }

    // If user is admin and tries to access the exact /clients path, redirect to /admin.
    if (isAdmin && pathname === '/clients') {
        router.replace('/admin');
        return;
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);

  // While loading, show loader.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = userProfile?.role === 'admin';
  const shouldRender = user && (!adminOnly || isAdmin);

  // If the user is an admin but is on a path that starts with /clients,
  // we show a loader to prevent flashing content before the redirect in useEffect completes.
  if (isAdmin && pathname.startsWith('/clients')) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  // If all checks pass, render the protected content.
  if (shouldRender) {
    return <>{children}</>;
  }
  
  // As a fallback while waiting for redirect, show loader.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
