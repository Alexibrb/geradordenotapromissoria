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
      router.replace('/login');
      return;
    }

    const isAdmin = userProfile?.role === 'admin';

    if (adminOnly && !isAdmin) {
      router.replace('/clients');
      return;
    }
    
    // If an admin tries to access /clients directly, redirect them to the default admin page.
    if (isAdmin && pathname === '/clients') {
        router.replace('/admin/users');
        return;
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isAdmin = userProfile?.role === 'admin';

  if (user) {
    if (adminOnly) {
      if (isAdmin) {
        return <>{children}</>;
      } else {
        // This loader is shown while the redirect for non-admins on an admin page happens.
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }
    } else {
      // This handles the case where an admin lands on a non-admin page like /clients
      // and needs to be redirected. We show a loader during the redirect.
      if (isAdmin && pathname.startsWith('/clients')) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
      }
       return <>{children}</>;
    }
  }

  // This loader is shown for non-authenticated users while they are being redirected to login.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
