'use client';

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/types';
import { Loader, Save, Phone } from 'lucide-react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function AdminSettingsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const appSettingsRef = useMemoFirebase(() => 
    userProfile?.role === 'admin' ? doc(firestore, 'app_settings', 'general') : null,
    [firestore, userProfile]
  );
  const { data: appSettings, isLoading: areAppSettingsLoading } = useDoc<AppSettings>(appSettingsRef);

  useEffect(() => {
    if (appSettings?.upgradeWhatsappNumber) {
      setWhatsappNumber(appSettings.upgradeWhatsappNumber);
    }
  }, [appSettings]);

  const handleSaveAppSettings = () => {
    if (!appSettingsRef) return;
    setDocumentNonBlocking(appSettingsRef, { upgradeWhatsappNumber: whatsappNumber }, { merge: true });
    toast({
      title: 'Configurações Salvas',
      description: 'O número de WhatsApp para upgrade foi atualizado.',
      className: 'bg-accent text-accent-foreground',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-left">
          Configurações Gerais
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-left">
          Ajustes que afetam todo o sistema.
        </p>
      </header>

      {areAppSettingsLoading ? (
        <div className="flex justify-center">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contato para Upgrade</CardTitle>
              <CardDescription>Configure o número de WhatsApp que será usado na página de upgrade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="whatsapp-number" className="flex items-center"><Phone className="mr-2"/>Número do WhatsApp</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp-number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="5569992686894"
                  />
                   <Button onClick={handleSaveAppSettings}>
                      <Save className="mr-2" />
                      Salvar
                   </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use o formato internacional, ex: 55 DDD NÚMERO.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminSettingsPage;
