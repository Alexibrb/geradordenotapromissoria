import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";

type InstallmentSlipProps = {
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  creditorName: string;
  productReference: string;
};

export function InstallmentSlip({
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  creditorName,
  productReference,
}: InstallmentSlipProps) {

  const handlePrint = () => {
    const printContent = document.getElementById(`slip-${installmentNumber}`);
    const parent = printContent?.parentElement;
    if (printContent && parent) {
      parent.classList.add("print-container");
      window.print();
      parent.classList.remove("print-container");
    }
  };

  return (
    <div id={`slip-${installmentNumber}`} className="bg-card border-2 border-dashed rounded-lg p-4 print-break-inside-avoid relative overflow-hidden">
       <div className="absolute top-8 right-8 transform rotate-12">
        <div className="border-4 border-green-500 rounded-md p-2">
          <span className="text-3xl font-bold text-green-500 uppercase tracking-wider">
            Pago
          </span>
        </div>
      </div>
      <div className="flex justify-between items-start text-sm">
        <h3 className="font-bold text-lg">Comprovante de Pagamento</h3>
        <div className="text-right">
          <p className="font-semibold">Parcela</p>
          <p>{installmentNumber} de {totalInstallments}</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
        <div>
          <p className="text-muted-foreground">Valor Pago</p>
          <p className="font-bold text-lg text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value)}
          </p>
        </div>
      </div>
      <div className="mt-8 pt-4">
        <div className="w-3/4 mx-auto border-b border-foreground pb-1"></div>
        <p className="mt-2 text-center text-sm">Assinatura do Credor: {creditorName}</p>
      </div>
      <Separator orientation="horizontal" className="border-dashed my-4" />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <p>Este documento serve como comprovante do pagamento da parcela.</p>
        <Button onClick={handlePrint} variant="outline" size="sm" className="no-print">
            <Printer className="mr-2" />
            Imprimir
        </Button>
      </div>
    </div>
  );
}
