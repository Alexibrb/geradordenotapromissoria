"use-client";

import type { PromissoryNoteData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import jspdf from "jspdf";
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
    firstInstallmentDate,
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
      html2canvas(input, { 
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jspdf("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 30; // 15mm margin on each side
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight - 30) {
            imgHeight = pdfHeight - 30;
            imgWidth = imgHeight * ratio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = 15; // Position from the top

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
        <p className="text-xl">
          O valor principal será pago à vista em{" "}
          <strong className="font-black underline">{formattedDate}</strong>.
        </p>
      );
    }

    if (hasDownPayment && downPaymentValue && firstInstallmentDate) {
      const firstDateFormatted = format(firstInstallmentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
      const installmentDay = format(firstInstallmentDate, "dd");
      
      return (
        <p className="text-xl leading-relaxed">
          O pagamento será feito com uma entrada de <strong className="font-black">{downPaymentValueFormatted}</strong> paga em <strong className="font-black">{formattedDate}</strong>, e o restante em{" "}
          <strong className="font-black">{installments}</strong> parcelas mensais de <strong className="font-black">{installmentValueFormatted}</strong> cada. O primeiro pagamento da parcela será devido em <strong className="font-black underline">{firstDateFormatted}</strong>, e os pagamentos subsequentes serão devidos todo dia <strong className="font-black">{installmentDay}</strong> de cada mês subsequente.
        </p>
      );
    }
    
    return (
       <p className="text-xl leading-relaxed">
          O valor principal será pago em{" "}
          {installments === 1 ? (
            <>
              <strong className="font-black">{installments}</strong> parcela única de <strong className="font-black">{installmentValueFormatted}</strong>
            </>
          ) : (
            <>
              <strong className="font-black">{installments}</strong> parcelas mensais iguais de <strong className="font-black">{installmentValueFormatted}</strong> cada
            </>
          )}
          . O primeiro pagamento será devido em <strong className="font-black underline">{formattedDate}</strong>, e os pagamentos subsequentes serão
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
            <Button onClick={handleGeneratePdf} className="mt-4 sm:mt-0 no-print h-10 px-6">
              <FileDown className="mr-2 h-5 w-5" />
              Gerar PDF da Nota
            </Button>
        </div>
      </CardHeader>
      <CardContent id="note-print-area" className="prose prose-lg max-w-none bg-card p-12 text-black">
        {header && (
          <div className="text-center mb-10 border-b-2 pb-6">
              <h1 className="text-3xl font-black uppercase tracking-widest">{header}</h1>
              {creditorAddress && <p className="text-base text-muted-foreground mt-2">{creditorAddress}</p>}
          </div>
        )}
        <div className="flex justify-between items-start mb-10">
          <h2 className="text-center font-black text-4xl underline decoration-double">NOTA PROMISSÓRIA</h2>
          {noteNumber && <span className="font-mono text-sm bg-secondary px-3 py-1 rounded">Nº {noteNumber}</span>}
        </div>
        <p className="text-xl leading-relaxed">
          Pelo valor recebido, o signatário, <strong className="font-black uppercase">{clientName}</strong>, inscrito no CPF sob o nº{" "}
          <strong className="font-black">{clientCpf}</strong>, residente em <strong className="font-black">{clientAddress}</strong> (doravante "o Devedor"), promete
          pagar à ordem de <strong className="font-black uppercase">{creditorName}</strong>, inscrito no CPF/CNPJ sob o nº{" "}
          <strong className="font-black">{creditorCpf}</strong> (doravante "o Credor"), a quantia principal de{" "}
          <strong className="font-black text-2xl">{formattedValue}</strong>.
        </p>
        <p className="text-xl">
          Esta nota refere-se ao produto/serviço:{" "}
          <strong className="font-black underline">{productReference}</strong>.
        </p>
        
        {renderPaymentTerms()}
        
        {paymentType === 'a-prazo' && latePaymentClause && (
          <div className="bg-secondary/10 p-4 border-l-4 border-primary rounded mt-6">
             <p className="text-lg italic leading-snug">
              {latePaymentClause}
            </p>
          </div>
        )}
        <div className="mt-24 flex justify-between gap-12">
            <div className="w-1/2 text-center">
                <div className="w-full border-b-2 border-black pb-2"></div>
                <p className="mt-2 text-sm font-bold uppercase tracking-widest">Assinatura do Devedor</p>
                <p className="font-black text-lg leading-tight mt-1">{clientName}</p>
                <p className="text-base leading-tight">{clientCpf}</p>
            </div>
            <div className="w-1/2 text-center">
                <div className="w-full border-b-2 border-black pb-2"></div>
                 <p className="mt-2 text-sm font-bold uppercase tracking-widest">Assinatura do Credor</p>
                <p className="font-black text-lg leading-tight mt-1">{creditorName}</p>
                <p className="text-base leading-tight">{creditorCpf}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}