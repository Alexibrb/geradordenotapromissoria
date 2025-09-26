"use-client";

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
    header,
    noteNumber,
    clientName,
    clientCpf,
    clientAddress,
    creditorName,
    creditorCpf,
    creditorAddress,
    totalValue,
    paymentDate,
    installments,
    productReference,
    paymentType,
    hasDownPayment,
    downPaymentValue,
    latePaymentClause,
  } = data;

  const handleGeneratePdf = () => {
    const input = document.getElementById("note-print-area");
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 20; // 10mm margin on each side
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        
        const x = 10;
        const y = 10; // Position from the top

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save(`nota_promissoria_${noteNumber}.pdf`);
      });
    }
  };

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalValue);

  const formattedDate = format(paymentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const remainingValue = (totalValue || 0) - (downPaymentValue || 0);
  const singleInstallmentValue = installments > 0 ? remainingValue / installments : 0;
  const installmentValueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(singleInstallmentValue);
  const downPaymentValueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(downPaymentValue || 0);

  const renderPaymentTerms = () => {
    if (paymentType === 'a-vista') {
      return (
        <p>
          O valor principal será pago à vista em{" "}
          <strong>{formattedDate}</strong>.
        </p>
      );
    }

    const paymentDay = format(paymentDate, "dd");

    if (hasDownPayment && downPaymentValue) {
      return (
        <p>
          O pagamento será feito com uma entrada de <strong>{downPaymentValueFormatted}</strong> paga em <strong>{formattedDate}</strong>, e o restante em{" "}
          <strong>{installments}</strong> parcelas mensais de <strong>{installmentValueFormatted}</strong> cada. O primeiro pagamento da parcela será devido todo dia <strong>{paymentDay}</strong> de cada mês subsequente.
        </p>
      );
    }
    
    return (
       <p>
          O valor principal será pago em{" "}
          {installments === 1 ? (
            <>
              <strong>{installments}</strong> parcela única de <strong>{installmentValueFormatted}</strong>
            </>
          ) : (
            <>
              <strong>{installments}</strong> parcelas mensais iguais de <strong>{installmentValueFormatted}</strong> cada
            </>
          )}
          . O primeiro pagamento será devido em <strong>{formattedDate}</strong>, e os pagamentos subsequentes serão
          devidos no mesmo dia de cada mês consecutivo até que o principal seja
          pago integralmente.
        </p>
    );
  };

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
        {header && (
          <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-xl font-bold uppercase tracking-wider">{header}</h1>
              {creditorAddress && <p className="text-xs text-muted-foreground">{creditorAddress}</p>}
          </div>
        )}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-center font-bold text-xl">NOTA PROMISSÓRIA</h2>
          {noteNumber && <span className="font-mono text-xs">Nº {noteNumber}</span>}
        </div>
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
        
        {renderPaymentTerms()}
        
        {paymentType === 'a-prazo' && latePaymentClause && (
          <p>
            {latePaymentClause}
          </p>
        )}
        <div className="mt-16 flex justify-between">
            <div className="w-2/5 text-center">
                <div className="w-full border-b border-foreground pb-1"></div>
                <p className="mt-1 text-sm">Assinatura do Devedor</p>
                <p className="font-semibold text-sm leading-tight mt-1">{clientName}</p>
                <p className="text-xs leading-tight">{clientCpf}</p>
            </div>
            <div className="w-2/5 text-center">
                <div className="w-full border-b border-foreground pb-1"></div>
                 <p className="mt-1 text-sm">Assinatura do Credor</p>
                <p className="font-semibold text-sm leading-tight mt-1">{creditorName}</p>
                <p className="text-xs leading-tight">{creditorCpf}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
