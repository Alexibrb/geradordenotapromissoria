import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ClientProviderWrapper } from '@/firebase/client-provider-wrapper';

export const metadata: Metadata = {
  title: 'Gerador de Nota Promissória',
  description: 'Gere notas promissórias e carnês de pagamento.',
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        <ClientProviderWrapper>
          {children}
          <Toaster />
        </ClientProviderWrapper>
      </body>
    </html>
  );
}
