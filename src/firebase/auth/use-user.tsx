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

  useEffect(() => {
    // Do not redirect while loading. Wait for all auth/profile data to be available.
    if (isLoading) {
      return;
    }
    
    // If loading is finished, then check for permissions.
    if (!user) {
      router.replace('/login');
    } else if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
    }
  }, [isLoading, user, userProfile, adminOnly, router]);

  // While loading, show a spinner to prevent flash of content or premature redirection.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user is authenticated and has the correct role, render children.
  // If they don't have the correct role, the useEffect will have already initiated the redirect,
  // but we still need to prevent rendering the children. Showing a loader during the redirect is a good UX.
  if ((adminOnly && userProfile?.role !== 'admin') || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
