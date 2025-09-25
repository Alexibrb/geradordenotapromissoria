"use client";

import type { PromissoryNoteData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const handleGeneratePdf = () => {
    const input = document.getElementById("note-print-area");
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth - 20; // 10mm margin on each side
        const height = width / ratio;

        let position = 10;
        if (height < pdfHeight - 20) {
            position = (pdfHeight - height) / 2;
        }

        pdf.addImage(imgData, "PNG", 10, position, width, height);
        pdf.save("nota_promissoria.pdf");
      });
    }
  };

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalValue);

  const formattedDate = format(paymentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const singleInstallmentValue = totalValue / installments;
  const installmentValueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(singleInstallmentValue);

  const installmentText = installments === 1
    ? `parcela mensal de ${installmentValueFormatted}`
    : `parcelas mensais iguais de ${installmentValueFormatted} cada`;


  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-headline">Nota Promissória Gerada</CardTitle>
              <CardDescription>Revise o documento gerado abaixo.</CardDescription>
            </div>
            <Button onClick={handleGeneratePdf} className="mt-4 sm:mt-0 no-print">
              <FileDown className="mr-2" />
              Gerar PDF da Nota
            </Button>
        </div>
      </CardHeader>
      <CardContent id="note-print-area" className="prose prose-sm max-w-none bg-card p-6">
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
          O valor principal será pago em <strong>{installments}</strong> {installments === 1 ? `parcela mensal de ${installmentValueFormatted}` : `parcelas mensais iguais de ${installmentValueFormatted} cada`}. O primeiro pagamento
          será devido em <strong>{formattedDate}</strong>, e os pagamentos subsequentes serão
          devidos no mesmo dia de cada mês consecutivo até que o principal seja
          pago integralmente.
        </p>
        <p>
          O atraso nos pagamentos por até 03 meses, acarretará na perda da propriedade e posse do imóvel, sem fazer jus a indenização ou ressarcimento de valores já efetuados pelo comprador.
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
