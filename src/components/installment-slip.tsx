import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";

type InstallmentSlipProps = {
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  productReference: string;
};

export function InstallmentSlip({
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  productReference,
}: InstallmentSlipProps) {

  const handlePrint = () => {
    const printContent = document.getElementById(`slip-${installmentNumber}`);
    if (printContent) {
      printContent.classList.add("print-container");
      window.print();
      printContent.classList.remove("print-container");
    }
  };

  return (
    <div id={`slip-${installmentNumber}`} className="bg-card border-2 border-dashed rounded-lg p-4 print-break-inside-avoid">
      <div className="flex justify-between items-start text-sm">
        <h3 className="font-bold text-lg">Boleto de Pagamento</h3>
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
          <p className="text-muted-foreground">Valor a Pagar</p>
          <p className="font-bold text-lg text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value)}
          </p>
        </div>
      </div>
      <Separator orientation="horizontal" className="border-dashed my-4" />
      <div className="text-xs text-muted-foreground">
        <p>Este é um boleto de nota promissória. O pagamento deve ser feito na data de vencimento ou antes. </p>
        <p>Para dúvidas, entre em contato conosco com seus detalhes de referência.</p>
      </div>
    </div>
  );
}
