"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { FileDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type InstallmentSlipProps = {
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  clientCpf: string;
  creditorName: string;
  creditorCpf: string;
  productReference: string;
  noteNumber?: string;
};

export function InstallmentSlip({
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  clientCpf,
  creditorName,
  creditorCpf,
  productReference,
  noteNumber,
}: InstallmentSlipProps) {
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState<Date | null>(null);

  const handlePaidChange = (checked: boolean) => {
    setIsPaid(checked);
    if (checked) {
      setPaidDate(new Date());
    } else {
      setPaidDate(null);
    }
  };

  const handleGeneratePdf = () => {
    const slipElement = document.getElementById(`slip-container-${installmentNumber}`);
    const pdfArea = slipElement?.querySelector<HTMLElement>(`#slip-${installmentNumber}-pdf-area`);
    
    if (pdfArea && slipElement) {
        // Show paid stamp if checked for the PDF
        const stamp = slipElement.querySelector('.paid-stamp-area') as HTMLElement;
        if (isPaid && stamp) {
            stamp.style.display = 'block';
        }

        html2canvas(pdfArea, { scale: 1 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 0.7); // Use JPEG with quality 0.7
            const pdf = new jsPDF("p", "mm", "a5");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            let imgWidth = pdfWidth - 20; // 10mm margin
            let imgHeight = imgWidth / ratio;

            if (imgHeight > pdfHeight - 20) {
              imgHeight = pdfHeight - 20;
              imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 10; // Position from the top

            pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, 'FAST');
            pdf.save(`comprovante_parcela_${installmentNumber}_${noteNumber}.pdf`);

            // Hide paid stamp again after generation
            if (isPaid && stamp) {
                stamp.style.display = 'none';
            }
        });
    }
  };

  const checkboxId = `paid-checkbox-${noteNumber}-${installmentNumber}`;

  return (
    <div id={`slip-container-${installmentNumber}`} className="bg-card border-2 border-dashed rounded-lg overflow-hidden print-break-inside-avoid">
        <div id={`slip-${installmentNumber}-pdf-area`} className="bg-card p-4 relative">
            <div className="flex justify-between items-start text-sm">
            <div>
              <h3 className="font-bold text-lg">Comprovante de Pagamento</h3>
              {noteNumber && <p className="text-xs text-muted-foreground">Ref. Nota Nº {noteNumber}</p>}
            </div>
            <div className="text-right">
                <p className="font-semibold">Parcela</p>
                <p>{installmentNumber} de {totalInstallments}</p>
            </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm relative">
            <div>
                <p className="text-muted-foreground">Nome do Cliente</p>
                <p className="font-semibold">{clientName} - {clientCpf}</p>
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
                <p className="font-bold text-lg text-black">
                {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(value)}
                </p>
            </div>
            </div>
            <div className="paid-stamp-area" style={{ display: isPaid ? 'block' : 'none' }}>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-80 pointer-events-none">
                    <div className="border-4 border-green-500 rounded-md px-4 py-2 text-center">
                    <span className="text-3xl font-bold text-green-500 uppercase tracking-wider">
                        Pago
                    </span>
                    {paidDate && (
                        <span className="block text-xs font-semibold text-green-600 mt-1">
                        {format(paidDate, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                    )}
                    </div>
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
        </div>
        <div className="no-print p-4 border-t-2 border-dashed">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                    <Checkbox id={checkboxId} checked={isPaid} onCheckedChange={(checked) => handlePaidChange(!!checked)} />
                    <Label htmlFor={checkboxId}>Marcar como Pago</Label>
                </div>
                <Button onClick={handleGeneratePdf} variant="outline" size="sm">
                    <FileDown className="mr-2" />
                    Gerar PDF
                </Button>
            </div>
        </div>
    </div>
  );
}
