'use client';

import { FirebaseClientProvider } from "./client-provider";

export function ClientProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
    )
}
