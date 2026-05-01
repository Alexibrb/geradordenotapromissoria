
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { FileDown, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type InstallmentSlipProps = {
  header?: string;
  slipId: string;
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  clientCpf: string;
  clientAddress: string;
  creditorName: string;
  creditorCpf: string;
  creditorAddress: string;
  productReference: string;
  noteNumber?: string;
  isDownPayment: boolean;
  isPaid: boolean;
  paidDate?: Date;
  onPaidChange: (checked: boolean) => void;
};

export function InstallmentSlip({
  header,
  slipId,
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  clientCpf,
  clientAddress,
  creditorName,
  creditorCpf,
  creditorAddress,
  productReference,
  noteNumber,
  isDownPayment,
  isPaid,
  paidDate,
  onPaidChange
}: InstallmentSlipProps) {
  const [showConfirmPaid, setShowConfirmPaid] = useState(false);
  const [showConfirmUnpaid, setShowConfirmUnpaid] = useState(false);

  const handleGeneratePdf = () => {
    const slipElement = document.getElementById(`slip-container-${slipId}`);
    const pdfArea = slipElement?.querySelector<HTMLElement>(`#slip-${slipId}-pdf-area`);
    
    if (pdfArea && slipElement) {
        const stamp = slipElement.querySelector('.paid-stamp-area') as HTMLElement;
        const wasVisible = stamp.style.display === 'block';

        if (isPaid) {
          stamp.style.display = 'block';
        }

        html2canvas(pdfArea, { 
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        }).then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            let imgWidth = pdfWidth - 30; // 15mm margins
            let imgHeight = imgWidth / ratio;

            if (imgHeight > pdfHeight - 30) {
              imgHeight = pdfHeight - 30;
              imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 15;

            pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, 'SLOW');
            pdf.save(`comprovante_${isDownPayment ? 'entrada' : `parcela_${installmentNumber}`}_${noteNumber}.pdf`);

            if (!wasVisible) {
                stamp.style.display = 'none';
            }
        });
    }
  };
  
  const checkboxId = `paid-checkbox-${slipId}`;
  const titleText = isDownPayment ? 'Comprovante de Entrada' : 'Comprovante de Pagamento';
  const installmentText = isDownPayment ? 'Entrada' : `Parcela ${installmentNumber} de ${totalInstallments}`;

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  return (
    <div id={`slip-container-${slipId}`} className="bg-card border-2 border-dashed rounded-lg overflow-hidden print-break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
        <div id={`slip-${slipId}-pdf-area`} className="bg-card p-6 relative">
             {header && (
                <div className="text-center mb-4 border-b pb-2">
                    <h2 className="text-lg font-semibold uppercase tracking-wider">{header}</h2>
                    {creditorAddress && <p className="text-xs text-muted-foreground">{creditorAddress}</p>}
                </div>
            )}
            <div className="flex justify-between items-start text-sm">
              <div>
                <h3 className="font-bold text-lg text-primary">{titleText}</h3>
                {noteNumber && <p className="text-xs text-muted-foreground">Ref. Doc. {slipId}</p>}
              </div>
              <div className="text-right">
                  <p className="font-semibold px-2 py-1 bg-secondary rounded-md">{installmentText}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm relative">
                <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold">Nome do Cliente</p>
                    <p className="font-semibold">{clientName}</p>
                    <p className="text-xs">{clientCpf}</p>
                    <p className="text-[10px] text-muted-foreground italic">{clientAddress}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold">Referência</p>
                    <p className="font-semibold">{productReference}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold">Data de Vencimento</p>
                    <p className="font-semibold">{format(dueDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="relative">
                    <p className="text-muted-foreground text-xs uppercase font-bold">Valor</p>
                    <p className="font-bold text-2xl text-black">
                      {formattedValue}
                    </p>
                     <div className="paid-stamp-area" style={{ display: isPaid ? 'block' : 'none' }}>
                        <div className="absolute -top-6 -right-2 transform -rotate-12 opacity-90 pointer-events-none">
                            <div className="border-4 border-green-600 rounded-lg px-4 py-2 text-center bg-white/50 backdrop-blur-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span className="text-3xl font-black text-green-600 uppercase tracking-tighter">
                                    Pago
                                </span>
                              </div>
                              {paidDate && (
                                  <span className="block text-xs font-bold text-green-700 mt-1">
                                    EM {format(paidDate, "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                              )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
           
            <div className="mt-10 pt-4">
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
        
        <div className="no-print p-4 bg-secondary/20 border-t-2 border-dashed flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <Checkbox 
                  id={checkboxId} 
                  checked={isPaid} 
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setShowConfirmPaid(true);
                    } else {
                      setShowConfirmUnpaid(true);
                    }
                  }} 
                />
                <Label htmlFor={checkboxId} className="cursor-pointer font-semibold text-sm">
                  {isPaid ? 'Pagamento Confirmado' : 'Marcar como Pago'}
                </Label>
            </div>
            <Button onClick={handleGeneratePdf} variant="outline" size="sm" className="h-8">
                <FileDown className="mr-2 h-4 w-4" />
                PDF
            </Button>
        </div>

        {/* Dialogs de Confirmação */}
        <AlertDialog open={showConfirmPaid} onOpenChange={setShowConfirmPaid}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Você deseja confirmar o pagamento da <strong>{installmentText}</strong> no valor de <strong>{formattedValue}</strong> para o cliente <strong>{clientName}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="default" onClick={() => {
                onPaidChange(true);
                setShowConfirmPaid(false);
              }}>
                Confirmar Pagamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showConfirmUnpaid} onOpenChange={setShowConfirmUnpaid}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Estornar Pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover a confirmação de pagamento desta parcela? O status voltará para "Pendente".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => {
                onPaidChange(false);
                setShowConfirmUnpaid(false);
              }}>
                Sim, Estornar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
