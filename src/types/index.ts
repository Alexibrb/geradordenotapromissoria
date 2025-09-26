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

export interface UserSettings {
  header?: string;
  creditorName?: string;
  creditorCpf?: string;
}

    