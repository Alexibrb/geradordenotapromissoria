
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
import jspdf from "jspdf";
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
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200, // Força layout consistente
        }).then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const pdf = new jspdf("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            let imgWidth = pdfWidth - 20; 
            let imgHeight = imgWidth / ratio;

            if (imgHeight > pdfHeight - 20) {
              imgHeight = pdfHeight - 20;
              imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 10;

            pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, 'FAST');
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
        <div id={`slip-${slipId}-pdf-area`} className="bg-card p-8 relative">
             {header && (
                <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">{header}</h2>
                    {creditorAddress && <p className="text-sm text-muted-foreground mt-1">{creditorAddress}</p>}
                </div>
            )}
            <div className="flex justify-between items-center text-sm mb-4">
              <div>
                <h3 className="font-black text-3xl text-primary">{titleText}</h3>
                {noteNumber && <p className="text-sm text-muted-foreground mt-1">Ref. Doc. {slipId}</p>}
              </div>
              <div className="text-right">
                  <p className="font-bold text-lg px-4 py-2 bg-secondary rounded-md">{installmentText}</p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 relative mb-8">
                <div>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-tight mb-1">Nome do Cliente</p>
                    <p className="font-bold text-xl">{clientName}</p>
                    <p className="text-base mt-1">{clientCpf}</p>
                    <p className="text-sm text-muted-foreground italic mt-1">{clientAddress}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-tight mb-1">Referência</p>
                    <p className="font-bold text-lg leading-snug">{productReference}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-tight mb-1">Data de Vencimento</p>
                    <p className="font-bold text-xl">{format(dueDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="relative">
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-tight mb-1">Valor</p>
                    <p className="font-black text-4xl text-black">
                      {formattedValue}
                    </p>
                     <div className="paid-stamp-area" style={{ display: isPaid ? 'block' : 'none' }}>
                        <div className="absolute -top-10 -right-4 transform -rotate-12 opacity-95 pointer-events-none">
                            <div className="border-4 border-green-600 rounded-xl px-6 py-3 text-center bg-white/80 shadow-lg backdrop-blur-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <span className="text-4xl font-black text-green-600 uppercase tracking-tighter">
                                    Pago
                                </span>
                              </div>
                              {paidDate && (
                                  <span className="block text-sm font-black text-green-700 mt-1">
                                    EM {format(paidDate, "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                              )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
           
            <div className="mt-16 pt-8">
            <div className="w-3/5 mx-auto text-center">
                <div className="border-b-2 border-foreground pb-2">
                  <p className="text-lg font-bold">{creditorName}</p>
                  <p className="text-sm">{creditorCpf}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground font-semibold uppercase tracking-widest">
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
                <Label htmlFor={checkboxId} className="cursor-pointer font-bold text-base">
                  {isPaid ? 'Pagamento Confirmado' : 'Marcar como Pago'}
                </Label>
            </div>
            <Button onClick={handleGeneratePdf} variant="outline" size="sm" className="h-10 px-4">
                <FileDown className="mr-2 h-5 w-5" />
                Gerar PDF A4
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
