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

  // The overall loading state is true if auth is loading, or if we have a user but are still fetching their profile.
  const isLoading = isAuthLoading || (!!user && !userProfile && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Wait until the loading state is definitively false.
    if (isLoading) {
      return; 
    }

    // If still no user after loading, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }

    const isAdmin = userProfile?.role === 'admin';

    // If this is an admin-only route and the user is not an admin, redirect away.
    if (adminOnly && !isAdmin) {
      router.replace('/clients');
      return;
    }
    
    // If an admin logs in, redirect them to the admin dashboard.
    // This also handles admins trying to access non-admin pages like /clients.
    if (isAdmin && !pathname.startsWith('/admin')) {
        router.replace('/admin/settings');
        return;
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);


  // While loading, show a global spinner.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = userProfile?.role === 'admin';

  // For admin-only pages, render children only if the user is an admin.
  // Otherwise, show loader while redirecting.
  if (adminOnly) {
    return isAdmin ? <>{children}</> : (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For regular protected pages, show a loader for admins before they are redirected away.
  if (isAdmin && !pathname.startsWith('/admin')) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // For all other cases (e.g., regular user on regular page), render children.
  return <>{children}</>;
}
