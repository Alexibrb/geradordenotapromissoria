'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Fingerprint, Loader2, MailQuestion, MessageCircle, StickyNote } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
  initiatePasswordReset
} from '@/firebase/non-blocking-login';
import { FirebaseError } from 'firebase/app';
import type { AppSettings } from '@/types';
import { doc } from 'firebase/firestore';
import { ProtectedRoute } from '@/firebase/auth/use-user';


const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  cpf: z.string().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido para redefinir a senha.' }),
});


export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const appSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'general') : null, [firestore]);
  const { data: appSettings } = useDoc<AppSettings>(appSettingsRef);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
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
  
  const handleSuccess = () => {
    setIsSubmitting(false);
    // Redirection is now handled by the useUser hook and ProtectedRoute
  };

  const handleLogin = (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    initiateEmailSignIn(auth, values.email, values.password, handleSuccess, handleError);
  };
  
  const handleSignUp = (values: z.infer<typeof loginSchema>) => {
    if (!values.cpf || values.cpf.trim() === '' || values.cpf.length < 11) {
        form.setError('cpf', { type: 'manual', message: 'O CPF é obrigatório e deve ser válido.' });
        return;
    }
    setIsSubmitting(true);
    initiateEmailSignUp(auth, values.email, values.password, values.cpf, handleSuccess, handleError);
  };
  
  const handlePasswordReset = () => {
    try {
        resetPasswordSchema.parse({ email: resetEmail });
    } catch (error) {
        if (error instanceof z.ZodError) {
            toast({
                variant: 'destructive',
                title: 'Email inválido',
                description: error.errors[0].message,
            });
        }
        return;
    }

    setIsResetting(true);
    initiatePasswordReset(
        auth,
        resetEmail,
        () => {
            setIsResetting(false);
            setResetDialogOpen(false);
            toast({
                title: 'E-mail Enviado!',
                description: 'Verifique sua caixa de entrada para as instruções de redefinição de senha.',
                className: 'bg-accent text-accent-foreground',
            });
        },
        (error) => {
            setIsResetting(false);
            toast({
                variant: 'destructive',
                title: 'Erro ao Enviar E-mail',
                description: 'Não foi possível encontrar uma conta com este e-mail.',
            });
        }
    );
  };

  const handleEmailRecovery = () => {
    const whatsappNumber = appSettings?.upgradeWhatsappNumber || '5569992686894';
    const message = 'Olá, esqueci o e-mail da minha conta e gostaria de ajuda para recuperá-lo.';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };
  
  return (
    <ProtectedRoute>
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Link href="/" className="mb-6 flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <StickyNote className="h-10 w-10" />
                <h1 className="text-2xl font-bold tracking-tight">Gerador de Nota Promissória</h1>
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader>
                <CardTitle className="text-2xl font-bold">{isSigningUp ? 'Crie Sua Conta' : 'Acesse sua Conta'}</CardTitle>
                <CardDescription>
                    {isSigningUp ? 'Preencha os campos para começar a gerenciar suas notas.' : 'Entre com seus dados para acessar o sistema.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(isSigningUp ? handleSignUp : handleLogin)} className="space-y-4">
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
                    {isSigningUp && (
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
                        )}
                    
                    {!isSigningUp && (
                        <Dialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="p-0 h-auto font-normal text-muted-foreground" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setResetDialogOpen(true); }}>
                                Esqueceu a senha?
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><MailQuestion/>Redefinir Senha</DialogTitle>
                                <DialogDescription>
                                    Digite seu e-mail para receber um link de redefinição de senha.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">E-mail</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        disabled={isResetting}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={isResetting}>Cancelar</Button>
                                <Button onClick={handlePasswordReset} disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar E-mail
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    )}
                    
                    <div className="flex flex-col gap-2 pt-4">
                        {isSigningUp ? (
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Conta
                            </Button>
                        ) : (
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Entrar
                            </Button>
                        )}
                        
                        <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSigningUp(!isSigningUp)}
                        className="w-full"
                        disabled={isSubmitting}
                        >
                        {isSigningUp ? 'Já tenho uma conta' : 'Criar uma Conta'}
                        </Button>
                    </div>
                    </form>
                </Form>
                </CardContent>
            </Card>
            <div className="mt-4 text-center text-sm text-muted-foreground">
                <button onClick={handleEmailRecovery} className="inline-flex items-center gap-2 hover:underline">
                    <MessageCircle className="h-4 w-4"/> Esqueceu seu e-mail? Fale conosco.
                </button>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-4 text-center">
                <p className="text-sm text-muted-foreground">Versão 1.0.2025 - Desenvolvido por Alex Alves</p>
            </div>
        </main>
    </ProtectedRoute>
  );
}
