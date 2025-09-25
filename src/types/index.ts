import { Timestamp } from "firebase/firestore";

export type PromissoryNoteData = {
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
};

export interface Client {
  id: string;
  name: string;
  address: string;
  cpf: string;
  contactInformation: string;
}

export interface PromissoryNote {
  id: string;
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
}
