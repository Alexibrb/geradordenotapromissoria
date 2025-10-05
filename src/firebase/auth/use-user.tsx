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
  const pathname = usePathname();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const isLoading = isAuthLoading || isProfileLoading;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    if (userProfile?.role === 'admin') {
      if (!pathname.startsWith('/admin')) {
        router.replace('/admin');
      }
    } else if (userProfile?.role === 'user') {
      if (pathname.startsWith('/admin')) {
        router.replace('/clients');
      }
    }

  }, [user, userProfile, isLoading, pathname, router]);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Aguarda o carregamento terminar
    }

    // Se não há usuário, redireciona para login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Se a rota é apenas para admin e o usuário não é admin, redireciona
    if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
    }

  }, [isLoading, user, userProfile, adminOnly, router]);

  // Enquanto carrega ou enquanto o redirecionamento está prestes a acontecer, mostra um loader
  if (isLoading || !user || (adminOnly && userProfile?.role !== 'admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se tudo estiver certo, renderiza o conteúdo
  return <>{children}</>;
}
