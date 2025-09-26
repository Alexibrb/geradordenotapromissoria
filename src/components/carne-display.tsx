"use client";

import type { PromissoryNoteData, Payment } from "@/types";
import { addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown, Receipt, CircleOff, CheckCircle } from "lucide-react";
import { InstallmentSlip } from "@/components/installment-slip";
import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type CarneDisplayProps = {
  data: PromissoryNoteData;
  payments?: Payment[];
  onPaymentStatusChange: (isPaid: boolean, installmentNumber: number, value: number, isDownPayment: boolean) => void;
};

type SlipData = {
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
    creditorAddress?: string;
    productReference: string;
    noteNumber?: string;
    isDownPayment: boolean;
};

export function CarneDisplay({ data, payments = [], onPaymentStatusChange }: CarneDisplayProps) {
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const { 
      header,
      totalValue, 
      installments, 
      paymentDate, 
      clientName, 
      clientCpf,
      clientAddress,
      productReference, 
      creditorName, 
      creditorCpf, 
      creditorAddress,
      noteNumber,
      paymentType,
      hasDownPayment,
      downPaymentValue
  } = data;

  const allInstallmentSlips: SlipData[] = useMemo(() => {
    let slips: SlipData[] = [];
    if (paymentType === 'a-vista') {
       slips.push({
        header,
        slipId: `${noteNumber}-1`,
        installmentNumber: 1,
        totalInstallments: 1,
        value: totalValue,
        dueDate: paymentDate,
        clientName: clientName,
        clientCpf: clientCpf,
        clientAddress: clientAddress,
        creditorName: creditorName,
        creditorCpf: creditorCpf,
        creditorAddress: creditorAddress,
        productReference,
        noteNumber,
        isDownPayment: false,
      });
    } else { // a-prazo
        const remainingValue = totalValue - (downPaymentValue || 0);
        const installmentValue = installments > 0 ? remainingValue / installments : 0;
        
        if (hasDownPayment && downPaymentValue) {
          slips.push({
              header,
              slipId: `${noteNumber}-entrada`,
              installmentNumber: 0, // 0 for down payment
              totalInstallments: installments,
              value: downPaymentValue,
              dueDate: paymentDate,
              clientName: clientName,
              clientCpf: clientCpf,
              clientAddress: clientAddress,
              creditorName: creditorName,
              creditorCpf: creditorCpf,
              creditorAddress: creditorAddress,
              productReference,
              noteNumber,
              isDownPayment: true,
          });
        }

        const firstInstallmentDate = hasDownPayment ? addMonths(paymentDate, 1) : paymentDate;

        for (let i = 0; i < installments; i++) {
          slips.push({
              header,
              slipId: `${noteNumber}-${i + 1}`,
              installmentNumber: i + 1,
              totalInstallments: installments,
              value: installmentValue,
              dueDate: addMonths(firstInstallmentDate, i),
              clientName: clientName,
              clientCpf: clientCpf,
              clientAddress: clientAddress,
              creditorName: creditorName,
              creditorCpf: creditorCpf,
              creditorAddress: creditorAddress,
              productReference,
              noteNumber,
              isDownPayment: false,
          });
        }
    }
    return slips;
  }, [data]);

  const filteredSlips = useMemo(() => {
    if (filter === 'all') {
      return allInstallmentSlips;
    }
    return allInstallmentSlips.filter(slip => {
      const isPaid = payments.some(p => p.installmentNumber === slip.installmentNumber);
      return filter === 'paid' ? isPaid : !isPaid;
    });
  }, [filter, allInstallmentSlips, payments]);

  const handleGeneratePdfAll = () => {
    const printArea = document.getElementById("carne-print-area");
    if (printArea) {
      const slipsToPrint = Array.from(printArea.querySelectorAll<HTMLElement>('.slip-to-print'));
      if (slipsToPrint.length === 0) {
        alert("Nenhum comprovante para gerar PDF.");
        return;
      }
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      let y = margin;

      const addCanvasToPdf = (canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.7);
        const ratio = canvas.width / canvas.height;
        const imgWidth = availableWidth;
        const imgHeight = imgWidth / ratio;

        if (y > margin && y + imgHeight + margin > pdf.internal.pageSize.getHeight()) {
          pdf.addPage();
          y = margin;
        }
        pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      };

      let promiseChain = Promise.resolve();

      slipsToPrint.forEach(slipElement => {
        promiseChain = promiseChain.then(() => {
          return new Promise<void>(resolve => {
            const pdfArea = slipElement.querySelector<HTMLElement>('[id^="slip-"][id$="-pdf-area"]');
            const checkbox = slipElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
            const stamp = slipElement.querySelector('.paid-stamp-area') as HTMLElement;
            const wasVisible = stamp.style.display === 'block';

            if (checkbox?.checked) {
              stamp.style.display = 'block';
            }
            
            html2canvas(pdfArea!, { scale: 1, backgroundColor: null }).then(canvas => {
              addCanvasToPdf(canvas);
              if (!wasVisible) {
                stamp.style.display = 'none';
              }
              resolve();
            });
          });
        });
      });

      promiseChain.then(() => {
        pdf.save(`carne_pagamento_${noteNumber}.pdf`);
      });
    }
  };
  
  const paidCount = payments.length;
  const totalPaidAmount = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline">Comprovantes de Pagamento</CardTitle>
            <CardDescription>
              {paidCount} de {allInstallmentSlips.length} parcelas pagas. Total pago: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaidAmount)}
            </CardDescription>
          </div>
           <div className="flex items-center gap-2 mt-4 sm:mt-0 no-print">
             <Button onClick={() => setFilter('pending')} variant={filter === 'pending' ? 'secondary' : 'outline'} size="sm"><CircleOff className="mr-2"/>Pendentes</Button>
             <Button onClick={() => setFilter('paid')} variant={filter === 'paid' ? 'secondary' : 'outline'} size="sm"><CheckCircle className="mr-2"/>Pagas</Button>
             <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'secondary' : 'outline'} size="sm"><Receipt className="mr-2"/>Todas</Button>
            <Button onClick={handleGeneratePdfAll} size="sm">
              <FileDown className="mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id="carne-print-area" className="space-y-6">
          {filteredSlips.map((slipData) => {
            const isPaid = payments.some(p => p.installmentNumber === slipData.installmentNumber);
            const paidInfo = payments.find(p => p.installmentNumber === slipData.installmentNumber);
            const paidDate = paidInfo?.paymentDate ? (paidInfo.paymentDate instanceof Date ? paidInfo.paymentDate : paidInfo.paymentDate.toDate()) : undefined;

            return (
              <React.Fragment key={slipData.slipId}>
                <div className="slip-to-print">
                  <InstallmentSlip 
                    {...slipData}
                    isPaid={isPaid}
                    paidDate={paidDate}
                    onPaidChange={(checked) => onPaymentStatusChange(checked, slipData.installmentNumber, slipData.value, slipData.isDownPayment)}
                  />
                </div>
              </React.Fragment>
            )
          })}
           {filteredSlips.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhum comprovante encontrado para este filtro.</p>
            </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
