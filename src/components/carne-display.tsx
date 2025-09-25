"use client";

import type { PromissoryNoteData } from "@/types";
import { addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { InstallmentSlip } from "@/components/installment-slip";
import React from "react";

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

  const handlePrintAll = () => {
    const printContent = document.getElementById("carne-print-area");
    if (printContent) {
      const parent = printContent.parentElement;
      if (parent) {
        parent.classList.add("print-container");
        window.print();
        parent.classList.remove("print-container");
      }
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
          <Button onClick={handlePrintAll} className="mt-4 sm:mt-0 no-print">
            <Printer className="mr-2" />
            Imprimir Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="carne-print-area" className="space-y-6">
          {installmentSlips.map((slipData, index) => (
            <React.Fragment key={slipData.installmentNumber}>
              <InstallmentSlip {...slipData} />
              {(index + 1) < installmentSlips.length && <div className="print-break-after"></div>}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
