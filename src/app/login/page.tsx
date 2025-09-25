'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Fingerprint, Ghost, Loader2 } from 'lucide-react';

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
  initiateAnonymousSignIn,
  initiateEmailSignIn,
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
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
  
  // Local error handler for auth errors from the global listener
  const [authError, setAuthError] = useState<FirebaseError | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/clients');
    }
  }, [user, isUserLoading, router]);

  // This will now listen for errors from onAuthStateChanged
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(
      () => {}, // Success case is handled by the useUser hook
      (error) => {
        setIsSubmitting(false);
        let title = 'Ocorreu um erro';
        let description = 'Por favor, tente novamente mais tarde.';
        
        // This is a simplified version, as the error from onAuthStateChanged
        // might not have a specific code like direct sign-in method calls.
        // For more specific errors, you'd need a more robust global error handling strategy.
        if (error instanceof FirebaseError) {
           switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              title = 'Credenciais inválidas';
              description = 'O e-mail ou a senha estão incorretos.';
              break;
            case 'auth/email-already-in-use':
              title = 'E-mail já cadastrado';
              description =
                'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
              break;
            case 'auth/invalid-email':
              title = 'E-mail inválido';
              description = 'O formato do e-mail fornecido não é válido.';
              break;
            default:
              title = 'Erro de Autenticação'
              description = 'Não foi possível fazer login. Verifique suas credenciais.';
              break;
          }
        }

        toast({
          variant: 'destructive',
          title,
          description,
        });
      }
    );

    return () => unsubscribe();
  }, [auth, toast]);


  const handleLogin = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignIn(auth, values.email, values.password);
  };
  
  const handleSignUp = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignUp(auth, values.email, values.password);
  };

  const handleAnonymousLogin = () => {
    setIsSubmitting(true);
    initiateAnonymousSignIn(auth);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Acesse sua conta para gerenciar suas notas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
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
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSignUp)}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </div>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAnonymousLogin}
            disabled={isSubmitting}
          >
            <Ghost className="mr-2 h-4 w-4" />
            Acesso Anônimo
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
