'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, Users, Settings, LogOut, Home } from 'lucide-react';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const navItems = [
    { href: '/admin/settings', label: 'Configurações', icon: Settings },
    { href: '/admin/users', label: 'Gerenciar Usuários', icon: Users },
  ];

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="flex min-h-screen w-full bg-background">
        <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">
                    Administração
                </h1>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href} passHref>
                        <Button
                        variant={pathname === item.href ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>
            <div className='border-t pt-4 mt-4'>
                <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </aside>
        <main className="flex-1">
            <header className="flex h-14 items-center justify-end border-b bg-card px-4 md:hidden">
                 <Button onClick={handleLogout} variant="outline" size="icon">
                    <LogOut className="h-4 w-4" />
                </Button>
            </header>
            {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
