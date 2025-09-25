"use client";

import type { PromissoryNoteData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer } from "lucide-react";

type PromissoryNoteDisplayProps = {
  data: PromissoryNoteData;
};

export function PromissoryNoteDisplay({ data }: PromissoryNoteDisplayProps) {
  const {
    clientName,
    clientCpf,
    clientAddress,
    creditorName,
    creditorCpf,
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

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalValue);

  const formattedDate = format(paymentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const installmentValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalValue / installments);


  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-headline">Nota Promissória Gerada</CardTitle>
              <CardDescription>Revise o documento gerado abaixo.</CardDescription>
            </div>
            <Button onClick={handlePrint} className="mt-4 sm:mt-0 no-print">
              <Printer className="mr-2" />
              Imprimir Nota
            </Button>
        </div>
      </CardHeader>
      <CardContent id="note-print-area" className="prose prose-sm max-w-none">
        <h2 className="text-center font-bold text-xl mb-6">NOTA PROMISSÓRIA</h2>
        <p>
          Pelo valor recebido, o signatário, <strong>{clientName}</strong>, inscrito no CPF sob o nº{" "}
          <strong>{clientCpf}</strong>, residente em <strong>{clientAddress}</strong> (doravante "o Devedor"), promete
          pagar à ordem de <strong>{creditorName}</strong>, inscrito no CPF/CNPJ sob o nº{" "}
          <strong>{creditorCpf}</strong> (doravante "o Credor"), a quantia principal de{" "}
          <strong>{formattedValue}</strong>.
        </p>
        <p>
          Esta nota refere-se ao produto/serviço:{" "}
          <strong>{productReference}</strong>.
        </p>
        <p>
          O valor principal será pago em <strong>{installments}</strong> parcelas mensais
          iguais de <strong>{installmentValue}</strong> cada. O primeiro pagamento
          será devido em <strong>{formattedDate}</strong>, e os pagamentos subsequentes serão
          devidos no mesmo dia de cada mês consecutivo até que o principal seja
          pago integralmente.
        </p>
        <p>
          Em caso de inadimplência no pagamento de qualquer uma das referidas parcelas
          quando as mesmas se vencerem, o valor total do referido
          principal remanescente não pago tornar-se-á imediatamente devido e pagável.
        </p>
        <div className="mt-12 pt-8 border-t flex justify-between">
            <div className="w-2/5 text-center">
                <div className="w-full border-b border-foreground pb-1"></div>
                <p className="mt-2 text-sm">Assinatura do Devedor</p>
                <p className="font-semibold">{clientName}</p>
                <p className="text-xs">{clientCpf}</p>
            </div>
            <div className="w-2/5 text-center">
                <div className="w-full border-b border-foreground pb-1"></div>
                 <p className="mt-2 text-sm">Assinatura do Credor</p>
                <p className="font-semibold">{creditorName}</p>
                <p className="text-xs">{creditorCpf}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
