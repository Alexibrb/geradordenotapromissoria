'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader } from 'lucide-react';
import { ProtectedRoute } from '@/firebase/auth/use-user';

// This page will now act as a redirect to the default admin section.
export default function AdminRedirectPage() {
  const router = useRouter();
  const { userProfile, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && userProfile?.role === 'admin') {
      router.replace('/admin/settings');
    }
  }, [isLoading, userProfile, router]);

  return (
     <ProtectedRoute adminOnly={true}>
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className='ml-2'>Redirecionando para o painel de administração...</p>
        </div>
    </ProtectedRoute>
  );
}
