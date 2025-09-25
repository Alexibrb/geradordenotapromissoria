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
  const { totalValue, installments, paymentDate, clientName, clientCpf, productReference, creditorName, creditorCpf } = data;
  const installmentValue = totalValue / installments;

  const installmentSlips = Array.from({ length: installments }).map((_, i) => ({
    installmentNumber: i + 1,
    totalInstallments: installments,
    value: installmentValue,
    dueDate: addMonths(paymentDate, i),
    clientName,
    clientCpf,
    creditorName,
    creditorCpf,
    productReference,
  }));

  const handleGeneratePdfAll = () => {
    const input = document.getElementById("carne-print-area");
    if (input) {
      const slips = Array.from(input.querySelectorAll<HTMLElement>('.slip-to-print'));
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;

      let promises = slips.map(slip => html2canvas(slip, { scale: 2, backgroundColor: null }));

      Promise.all(promises).then((canvases) => {
        let y = margin;
        canvases.forEach((canvas, index) => {
          const imgData = canvas.toDataURL("image/png");
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const ratio = canvasWidth / canvasHeight;
          const imgWidth = availableWidth;
          const imgHeight = imgWidth / ratio;
          
          if (y + imgHeight + margin > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            y = margin;
          }

          pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
          y += imgHeight + 10; // Add some space between slips
        });
        pdf.save("carne_pagamento.pdf");
      });
    }
  };

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline">Comprovantes de Pagamento</CardTitle>
            <CardDescription>
              Foram gerados {installments} comprovantes, um para cada parcela.
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
          {installmentSlips.map((slipData) => (
            <React.Fragment key={slipData.installmentNumber}>
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
