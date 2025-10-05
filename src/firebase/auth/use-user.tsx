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
    
    // If an admin tries to access a non-admin page like /clients, redirect to the admin dashboard.
    if (isAdmin && pathname.startsWith('/clients')) {
        router.replace('/admin/users');
        return;
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);


  // While loading, show a global spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = userProfile?.role === 'admin';

  // If we're done loading and we have a user:
  if (user) {
    // For admin-only pages, render children only if the user is an admin.
    // If not an admin, show a spinner during the brief moment before the useEffect redirects them.
    if (adminOnly) {
      return isAdmin ? <>{children}</> : (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    } 
    // For regular protected pages, show a spinner for admins before they are redirected away from client pages.
    else if (isAdmin && pathname.startsWith('/clients')) {
       return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
    }
    // Otherwise, it's a regular user on a regular page, so render the children.
    else {
       return <>{children}</>;
    }
  }

  // If no user and not loading (should be redirected by useEffect, but as a fallback), show a spinner.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
