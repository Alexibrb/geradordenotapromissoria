'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Fingerprint, Loader2, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import { useAuth } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { FirebaseError } from 'firebase/app';

const signupSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  cpf: z.string().min(11, { message: 'O CPF deve ter pelo menos 11 caracteres.' }),
});

export default function SignupPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      cpf: '',
    },
  });

  const handleError = (error: FirebaseError) => {
    setIsSubmitting(false);
    let title = 'Ocorreu um erro';
    let description = 'Por favor, tente novamente mais tarde.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        title = 'E-mail já cadastrado';
        description = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
        break;
      case 'auth/invalid-email':
        title = 'E-mail inválido';
        description = 'O formato do e-mail fornecido não é válido.';
        break;
      default:
        title = 'Erro de Cadastro';
        description = `Não foi possível criar a conta. (${error.code})`;
        break;
    }

    toast({
        variant: 'destructive',
        title,
        description,
    });
  }
  
  const handleSuccess = () => {
    setIsSubmitting(false);
    toast({
      title: 'Conta Criada!',
      description: 'Você será redirecionado para a página de login.',
      className: 'bg-accent text-accent-foreground',
    });
    router.push('/clients');
  };

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignUp(auth, values.email, values.password, values.cpf, handleSuccess, handleError);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Link href="/" className="mb-6 flex flex-col items-center gap-2 text-foreground hover:text-primary transition-colors">
            <StickyNote className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight">Gerador de Nota Promissória</h1>
        </Link>
        <Card className="w-full max-w-sm">
            <CardHeader>
            <CardTitle className="text-2xl font-bold">Crie Sua Conta</CardTitle>
            <CardDescription>
                Preencha os campos para começar a gerenciar suas notas.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Fingerprint className='mr-2 h-4 w-4' />CPF</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="Seu CPF (somente números)"
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
                        Criar Conta
                    </Button>
                </div>
                </form>
            </Form>
            </CardContent>
        </Card>
        <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
                Faça login
            </Link>
        </div>
         <div className="absolute bottom-0 left-0 w-full p-4 text-center">
            <p className="text-sm text-muted-foreground">Versão 1.0.2025 - Desenvolvido por Alex Alves</p>
        </div>
    </main>
  );
}
