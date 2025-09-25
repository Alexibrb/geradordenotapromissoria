'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser as useFirebaseUser } from '@/firebase/provider';
import { Loader } from 'lucide-react';

/**
 * Hook to manage user authentication state and protect routes.
 * @param {string} redirectTo - The path to redirect to if the user is not authenticated.
 * @returns The user object and loading state.
 */
export function useUser({ redirectTo = '/login' } = {}) {
  const { user, isUserLoading, userError } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect.
    if (!isUserLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, isUserLoading, router, redirectTo]);

  // Optionally, you could handle `userError` here, e.g., by showing a toast.

  return { user, isUserLoading };
}

/**
 * A component that renders its children only if a user is authenticated.
 * Otherwise, it shows a loading indicator and handles redirection.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
