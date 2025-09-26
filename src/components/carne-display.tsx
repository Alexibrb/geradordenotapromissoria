"use client";

import type { PromissoryNoteData } from "@/types";
import { addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import { InstallmentSlip } from "@/components/installment-slip";
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type CarneDisplayProps = {
  data: PromissoryNoteData;
};

export function CarneDisplay({ data }: CarneDisplayProps) {
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

  let installmentSlips = [];
  
  if (paymentType === 'a-vista') {
     installmentSlips.push({
      header,
      slipId: `${noteNumber}-1`,
      installmentNumber: 1,
      totalInstallments: 1,
      value: totalValue,
      dueDate: paymentDate,
      clientName,
      clientCpf,
      clientAddress,
      creditorName,
      creditorCpf,
      creditorAddress,
      productReference,
      noteNumber,
      isDownPayment: false,
    });
  } else { // a-prazo
      const remainingValue = totalValue - (downPaymentValue || 0);
      const installmentValue = installments > 0 ? remainingValue / installments : 0;
      
      if (hasDownPayment && downPaymentValue) {
        installmentSlips.push({
            header,
            slipId: `${noteNumber}-entrada`,
            installmentNumber: 0, // Using 0 to denote down payment
            totalInstallments: installments,
            value: downPaymentValue,
            dueDate: paymentDate,
            clientName,
            clientCpf,
            clientAddress,
            creditorName,
            creditorCpf,
            creditorAddress,
            productReference,
            noteNumber,
            isDownPayment: true,
        });
      }

      const firstInstallmentDate = hasDownPayment ? addMonths(paymentDate, 1) : paymentDate;

      for (let i = 0; i < installments; i++) {
        installmentSlips.push({
            header,
            slipId: `${noteNumber}-${i + 1}`,
            installmentNumber: i + 1,
            totalInstallments: installments,
            value: installmentValue,
            dueDate: addMonths(firstInstallmentDate, i),
            clientName,
            clientCpf,
            clientAddress,
            creditorName,
            creditorCpf,
            creditorAddress,
            productReference,
            noteNumber,
            isDownPayment: false,
        });
      }
  }


  const handleGeneratePdfAll = () => {
    const input = document.getElementById("carne-print-area");
    if (input) {
      // Temporarily show paid stamps for PDF generation if they are checked
      const paidCheckboxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="paid-checkbox-"]'));
      const paidElements: HTMLElement[] = [];
      paidCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const slip = checkbox.closest('.slip-to-print');
          const stamp = slip?.querySelector('.paid-stamp-area') as HTMLElement;
          if (stamp) {
            stamp.style.display = 'block';
            paidElements.push(stamp);
          }
        }
      });


      const slips = Array.from(input.querySelectorAll<HTMLElement>('.slip-to-print'));
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;

      let promises = slips.map(slip => {
        const pdfArea = slip.querySelector<HTMLElement>('[id^="slip-"][id$="-pdf-area"]');
        return html2canvas(pdfArea!, { scale: 1, backgroundColor: null });
      });

      Promise.all(promises).then((canvases) => {
        let y = margin;
        canvases.forEach((canvas, index) => {
          const imgData = canvas.toDataURL("image/jpeg", 0.7); // Use JPEG with quality 0.7
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const ratio = canvasWidth / canvasHeight;
          const imgWidth = availableWidth;
          const imgHeight = imgWidth / ratio;
          
          if (y > margin && y + imgHeight + margin > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            y = margin;
          }

          pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight);
          y += imgHeight + 10; // Add some space between slips
        });
        pdf.save(`carne_pagamento_${noteNumber}.pdf`);
        
        // Hide paid stamps again after generation
        paidElements.forEach(el => el.style.display = 'none');
      });
    }
  };

  const totalSlips = installmentSlips.length;

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline">Comprovantes de Pagamento</CardTitle>
            <CardDescription>
              Foram gerados {totalSlips} comprovantes.
            </CardDescription>
          </div>
          <Button onClick={handleGeneratePdfAll} className="mt-4 sm:mt-0 no-print">
            <FileDown className="mr-2" />
            Gerar PDF de Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="carne-print-area" className="space-y-6">
          {installmentSlips.map((slipData, index) => (
            <React.Fragment key={index}>
              <div className="slip-to-print">
                <InstallmentSlip {...slipData} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
