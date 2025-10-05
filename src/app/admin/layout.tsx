'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, Users, Settings, LogOut, Menu } from 'lucide-react';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6 z-10">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="sr-only">Administração</span>
                </Link>
                {navItems.map((item) => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "transition-colors hover:text-foreground",
                            pathname === item.href ? "text-foreground font-semibold" : "text-muted-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span>Painel Admin</span>
                  </Link>
                  {navItems.map((item) => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-4 px-2.5",
                          pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </ProtectedRoute>
  );
}