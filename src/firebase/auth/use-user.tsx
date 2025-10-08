'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const ADMIN_EMAIL = 'alexandro.ibrb@gmail.com';

export const createUserDocument = async (user: User, firestore: any, cpf?: string | null) => {
    if (!user || !firestore) return null;

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            const isUserAdmin = user.email === ADMIN_EMAIL;
            const role = isUserAdmin ? 'admin' : 'user';
            const plan = isUserAdmin ? 'pro' : 'free';

            const newUser: Omit<AppUser, 'id'> = {
                email: user.email!,
                cpf: cpf || undefined,
                plan: plan,
                role: role,
                displayName: user.displayName || user.email,
                createdAt: Timestamp.now(),
            };

            await setDoc(userDocRef, newUser);
            return { id: user.uid, ...newUser } as AppUser;
        } else {
             return { id: userDocSnap.id, ...userDocSnap.data() } as AppUser;
        }
    } catch (error) {
        console.error("Error creating or getting user document:", error);
        return null;
    }
};

export function useUser() {
  const { user, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<AppUser>(userProfileRef);

  useEffect(() => {
    if (user && firestore && !isProfileLoading && !userProfile && !profileError) {
        createUserDocument(user, firestore);
    }
  }, [user, firestore, isProfileLoading, userProfile, profileError]);

  useEffect(() => {
    if (userProfile && userProfile.plan === 'pro' && userProfile.planExpirationDate) {
        const now = Timestamp.now();
        if (now > userProfile.planExpirationDate) {
            const userDocRef = doc(firestore, 'users', userProfile.id);
            setDocumentNonBlocking(userDocRef, { plan: 'free' }, { merge: true });
        }
    }
  }, [userProfile, firestore]);

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (isLoading) {
      return; // Aguarde o carregamento do usuário e do perfil
    }

    const isOnAuthPage = pathname === '/login' || pathname === '/';

    // 1. Lógica para usuário não logado
    if (!user) {
      if (!isOnAuthPage) {
        router.replace('/login'); // Se não estiver logado e não estiver na pág. de login/landing, redirecione para login
      }
      return; // Permanece nas páginas de login/landing
    }

    // 2. Lógica para usuário LOGADO
    // Se o usuário está logado e na página de login/landing, redirecione-o.
    if (isOnAuthPage) {
        // Redireciona para admin se o perfil já carregou E é admin.
        // Senão, redireciona para a página principal de clientes como padrão.
        if (userProfile?.role === 'admin') {
            router.replace('/admin');
        } else {
            router.replace('/clients');
        }
        return;
    }

    // 3. Lógica de proteção de rota para usuário LOGADO e FORA da página de login
    if (userProfile) { // Apenas execute se o perfil já foi carregado
        const isAdmin = userProfile.role === 'admin';

        // Redireciona não-admin da área de admin
        if (adminOnly && !isAdmin) {
          router.replace('/clients');
          return;
        }

        // Redireciona admin que está fora da área de admin
        if (isAdmin && !pathname.startsWith('/admin')) {
            router.replace('/admin');
            return;
        }

        // Redireciona não-admin que tenta acessar a área de admin
        if (!isAdmin && pathname.startsWith('/admin')) {
            router.replace('/clients');
            return;
        }
    }
  }, [isLoading, user, userProfile, adminOnly, router, pathname]);

  // Enquanto o estado de autenticação está sendo verificado, mostre um loader.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Se o usuário não está logado, só permite renderizar as páginas de login/landing.
  if (!user && (pathname !== '/login' && pathname !== '/')) {
      // Este return age como uma segunda barreira, mostrando um loader enquanto o redirect do useEffect acontece.
       return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // Se o usuário está logado, mas nas páginas de login/landing, mostra um loader enquanto é redirecionado.
  if (user && (pathname === '/login' || pathname === '/')) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // Renderiza o conteúdo da página protegida se todas as verificações passarem.
  return <>{children}</>;
}
