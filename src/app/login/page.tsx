'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Fingerprint, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // This state will be true once Firebase auth state is confirmed and we have a user.
  // It helps prevent redirects before the app knows who is logged in.
  const [authComplete, setAuthComplete] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // This effect now ONLY handles redirecting away from the login page
  // if a user is ALREADY logged in when they land here. The main
  // post-login redirect is handled by ProtectedRoute.
  useEffect(() => {
    if (!isUserLoading && user) {
      // User is already authenticated, let ProtectedRoute handle the redirect.
      // We can push them to a generic loading-like page or a base page.
      router.replace('/clients'); 
    }
  }, [isUserLoading, user, router]);
  
  const handleError = (error: FirebaseError) => {
    setIsSubmitting(false);
    let title = 'Ocorreu um erro';
    let description = 'Por favor, tente novamente mais tarde.';
    
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            title = 'Credenciais inválidas';
            description = 'O e-mail ou a senha estão incorretos.';
            break;
        case 'auth/email-already-in-use':
            title = 'E-mail já cadastrado';
            description = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
            break;
        case 'auth/invalid-email':
            title = 'E-mail inválido';
            description = 'O formato do e-mail fornecido não é válido.';
            break;
        default:
            title = 'Erro de Autenticação';
            description = `Não foi possível autenticar. (${error.code})`;
            break;
    }

    toast({
        variant: 'destructive',
        title,
        description,
    });
  }

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        setIsSubmitting(false);
        if (user) {
           // We have a user! Mark auth as complete.
           // The ProtectedRoute component will now handle the redirect.
           setAuthComplete(true);
        } else {
           // No user, stay on login page.
           setAuthComplete(false);
        }
      }, 
      (error) => {
        handleError(error as FirebaseError);
      }
    );

    return () => unsubscribe();
  }, [auth]);


  const handleLogin = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignIn(auth, values.email, values.password, handleError);
  };
  
  const handleSignUp = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignUp(auth, values.email, values.password, handleError);
  };

  // While checking auth state for the first time, or after a successful login, show a loader.
  if (isUserLoading || authComplete) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="absolute top-0 left-0 p-4">
        <h1 className="text-xl font-bold tracking-tight">Gerador de Nota Promissória</h1>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Acesse sua Conta</CardTitle>
          <CardDescription>
            Entre ou crie uma conta para começar a gerenciar suas notas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(handleLogin)(); }} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><AtSign className='mr-2 h-4 w-4' />Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Fingerprint className='mr-2 h-4 w-4' />Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); form.handleSubmit(handleSignUp)(); }}
                  className="w-full"
                  disabled={isSubmitting}
                >
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="absolute bottom-0 left-0 w-full p-4 text-center">
          <p className="text-sm text-muted-foreground">Versão 1.0.2025 - Desenvolvido por Alex Alves</p>
      </div>
    </main>
  );
}
