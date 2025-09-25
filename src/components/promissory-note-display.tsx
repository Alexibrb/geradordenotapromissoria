"use client";

import type { PromissoryNoteData } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer } from "lucide-react";

type PromissoryNoteDisplayProps = {
  data: PromissoryNoteData;
};

export function PromissoryNoteDisplay({ data }: PromissoryNoteDisplayProps) {
  const {
    clientName,
    clientAddress,
    totalValue,
    paymentDate,
    installments,
    productReference,
  } = data;

  const handlePrint = () => {
    const printContent = document.getElementById("note-print-area");
    if (printContent) {
      printContent.classList.add("print-container");
      window.print();
      printContent.classList.remove("print-container");
    }
  };

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalValue);

  const formattedDate = format(paymentDate, "MMMM do, yyyy");
  const installmentValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalValue / installments);


  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-headline">Generated Promissory Note</CardTitle>
              <CardDescription>Review the generated document below.</CardDescription>
            </div>
            <Button onClick={handlePrint} className="mt-4 sm:mt-0 no-print">
              <Printer className="mr-2" />
              Print Note
            </Button>
        </div>
      </CardHeader>
      <CardContent id="note-print-area" className="prose prose-sm max-w-none">
        <h2 className="text-center font-bold text-xl mb-6">PROMISSORY NOTE</h2>
        <p>
          For value received, the undersigned, <strong>{clientName}</strong>, residing at{" "}
          <strong>{clientAddress}</strong> (hereinafter "the Borrower"), promises to
          pay to the order of the creditor the principal sum of{" "}
          <strong>{formattedValue}</strong>.
        </p>
        <p>
          This note is in reference to the product/service:{" "}
          <strong>{productReference}</strong>.
        </p>
        <p>
          The principal amount shall be paid in <strong>{installments}</strong> equal monthly
          installments of <strong>{installmentValue}</strong> each. The first payment
          shall be due on <strong>{formattedDate}</strong>, and subsequent payments shall be
          due on the same day of each consecutive month until the principal is
          paid in full.
        </p>
        <p>
          In the event of default in the payment of any of the said installments
          as and when the same shall become due, the entire amount of the said
          principal sum then remaining unpaid shall at once become due and payable.
        </p>
        <div className="mt-12 pt-8 border-t">
            <div className="w-full">
                <div className="w-3/4 border-b border-foreground pb-1"></div>
                <p className="mt-2">Signature of Borrower: {clientName}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
