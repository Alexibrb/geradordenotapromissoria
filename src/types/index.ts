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
