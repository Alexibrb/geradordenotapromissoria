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

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run redirection logic once loading is complete.
    if (isLoading) {
      return;
    }

    // If there's no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }

    const isAdmin = userProfile?.role === 'admin';

    // If the route is for admins only and the user is not an admin, redirect.
    if (adminOnly && !isAdmin) {
      router.replace('/clients');
      return;
    }

    // If the user is an admin but tries to access a non-admin page, redirect to admin.
    if (isAdmin && pathname.startsWith('/clients')) {
        router.replace('/admin');
        return;
    }

  // This effect should only run when the loading state or user data changes.
  // We include router and pathname to handle navigations, but the isLoading guard prevents loops.
  }, [isLoading, user, userProfile, adminOnly, pathname, router]);

  // While loading, always show the loader.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user exists and has correct permissions, render the children.
  // This prevents rendering the protected content for a split second before redirection.
  const isAdmin = userProfile?.role === 'admin';
  const shouldRender = user && (!adminOnly || (adminOnly && isAdmin));
  
  // Also ensures admin doesn't see client pages briefly before redirect.
  const isCorrectPathForRole = !(isAdmin && pathname.startsWith('/clients'));


  if (shouldRender && isCorrectPathForRole) {
    return <>{children}</>;
  }

  // In all other cases (e.g., waiting for the redirect effect to run), show the loader.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
