import { Timestamp } from "firebase/firestore";

export type PaymentType = 'a-vista' | 'a-prazo';

export type PromissoryNoteData = {
  header?: string;
  clientName: string;
  clientAddress: string;
  clientCpf: string;
  clientContact?: string;
  creditorName: string;
  creditorCpf: string;
  creditorAddress: string;
  productReference: string;
  totalValue: number;
  paymentDate: Date;
  installments: number;
  noteNumber?: string;
  paymentType: PaymentType;
  hasDownPayment?: boolean;
  downPaymentValue?: number;
  latePaymentClause?: string;
};

export interface Client {
  id: string;
  name: string;
  address: string;
  cpf: string;
  contactInformation: string;
}

export interface PromissoryNote {
  id:string;
  header?: string;
  clientId: string;
  productServiceReference: string;
  value: number;
  paymentDate: Timestamp;
  numberOfInstallments: number;
  creditorName: string;
  creditorCpf: string;
  creditorAddress: string;
  clientCpf: string;
  clientAddress: string;
  clientName: string;
  clientContact?: string;
  noteNumber: string;
  paymentType: PaymentType;
  hasDownPayment?: boolean;
  downPaymentValue?: number;
  latePaymentClause?: string;
}

export interface Payment {
    id: string;
    promissoryNoteId: string;
    paymentDate: Date | Timestamp;
    amount: number;
    receiptNumber?: string;
    installmentNumber: number;
    isDownPayment: boolean;
}

export interface UserSettings {
  header?: string;
  creditorName?: string;
  creditorCpf?: string;
  creditorAddress?: string;
  latePaymentClause?: string;
}

export interface AppSettings {
  upgradeWhatsappNumber?: string;
  tutorialVideoUrl?: string;
}

export type UserPlan = 'free' | 'pro';
export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  email: string;
  cpf?: string;
  plan: UserPlan;
  role: UserRole;
  displayName?: string;
  createdAt: Timestamp;
  planExpirationDate?: Timestamp;
}

    

    
