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
    // Não faça nada enquanto os dados estão sendo carregados.
    // A decisão de redirecionar ou não só será tomada quando isLoading for false.
    if (isLoading) {
      return;
    }

    // Após o carregamento, verifique as condições de autenticação e permissão.
    if (!user) {
      router.replace('/login');
    } else if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
    }
  }, [isLoading, user, userProfile, adminOnly, router]);

  // Se ainda estiver carregando, exiba um loader.
  // Isso impede a renderização do conteúdo da página ou redirecionamentos prematuros.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se, após o carregamento, o usuário não estiver autenticado ou não tiver a permissão necessária,
  // o useEffect acima já terá iniciado o redirecionamento.
  // Renderize o loader novamente para evitar um piscar de conteúdo indesejado enquanto o redirecionamento acontece.
  if (!user || (adminOnly && userProfile?.role !== 'admin')) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se o usuário estiver autenticado e tiver as permissões corretas, renderize o conteúdo da página.
  return <>{children}</>;
}
