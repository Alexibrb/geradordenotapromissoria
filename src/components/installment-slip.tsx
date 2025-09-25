"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type InstallmentSlipProps = {
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  creditorName: string;
  creditorCpf: string;
  productReference: string;
};

export function InstallmentSlip({
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  creditorName,
  creditorCpf,
  productReference,
}: InstallmentSlipProps) {
  const [isPaid, setIsPaid] = useState(false);

  const handlePrint = () => {
    const printContent = document.getElementById(`slip-${installmentNumber}`);
    const parent = printContent?.parentElement;
    if (printContent && parent) {
      parent.classList.add("print-container");
      window.print();
      parent.classList.remove("print-container");
    }
  };

  const checkboxId = `paid-checkbox-${installmentNumber}`;

  return (
    <div id={`slip-${installmentNumber}`} className="bg-card border-2 border-dashed rounded-lg p-4 print-break-inside-avoid relative overflow-hidden">
      <div className="flex justify-between items-start text-sm">
        <h3 className="font-bold text-lg">Comprovante de Pagamento</h3>
        <div className="text-right">
          <p className="font-semibold">Parcela</p>
          <p>{installmentNumber} de {totalInstallments}</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm relative">
        <div>
          <p className="text-muted-foreground">Nome do Cliente</p>
          <p className="font-semibold">{clientName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Referência</p>
          <p className="font-semibold">{productReference}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Data de Vencimento</p>
          <p className="font-semibold">{format(dueDate, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
        <div className="relative">
          <p className="text-muted-foreground">Valor da Parcela</p>
          <p className="font-bold text-lg text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value)}
          </p>
           {isPaid && (
            <div className="absolute top-0 right-0 transform -rotate-12 -translate-y-2 translate-x-4 opacity-80">
              <div className="border-4 border-green-500 rounded-md px-2 py-1">
                <span className="text-2xl font-bold text-green-500 uppercase tracking-wider">
                  Pago
                </span>
              </div>
            </div>
           )}
        </div>
      </div>
      <div className="mt-8 pt-4">
        <div className="w-3/4 mx-auto text-center">
          <div className="border-b border-foreground pb-1">
            <p className="text-sm font-semibold">{creditorName}</p>
            <p className="text-xs">{creditorCpf}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Assinatura do Credor
          </p>
        </div>
      </div>
      <Separator orientation="horizontal" className="border-dashed my-4" />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center space-x-2 no-print">
          <Checkbox id={checkboxId} checked={isPaid} onCheckedChange={(checked) => setIsPaid(!!checked)} />
          <Label htmlFor={checkboxId}>Marcar como Pago</Label>
        </div>
        <Button onClick={handlePrint} variant="outline" size="sm" className="no-print">
            <Printer className="mr-2" />
            Imprimir
        </Button>
      </div>
    </div>
  );
}
