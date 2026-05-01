
'use client';

import type { PromissoryNoteData, Payment } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileDown, CheckCircle, Table as TableIcon } from "lucide-react";
import jspdf from "jspdf";
import html2canvas from "html2canvas";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PaymentStatementProps = {
  data: PromissoryNoteData;
  payments: Payment[];
};

export function PaymentStatement({ data, payments }: PaymentStatementProps) {
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
    productReference,
  } = data;

  const sortedPayments = [...payments].sort((a, b) => a.installmentNumber - b.installmentNumber);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const handleGeneratePdf = () => {
    const input = document.getElementById("statement-print-area");
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
        
        let imgWidth = pdfWidth - 30;
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight - 30) {
            imgHeight = pdfHeight - 30;
            imgWidth = imgHeight * ratio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = 15;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save(`extrato_quitacao_${noteNumber}.pdf`);
      });
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <Card className="shadow-xl border-t-4 border-t-blue-600 animate-in fade-in-50 duration-500">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <FileDown className="h-6 w-6 text-blue-600"/>
                Termo de Quitação e Extrato
              </CardTitle>
              <CardDescription>Documento oficial de encerramento de dívida.</CardDescription>
            </div>
            <Button onClick={handleGeneratePdf} className="bg-blue-600 hover:bg-blue-700 text-white no-print">
              <FileDown className="mr-2" />
              Baixar Extrato PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent id="statement-print-area" className="p-12 bg-white text-black min-h-[800px] flex flex-col">
        {header && (
          <div className="text-center mb-12 border-b-2 pb-6">
              <h1 className="text-3xl font-black uppercase tracking-widest">{header}</h1>
              {creditorAddress && <p className="text-base text-muted-foreground mt-2">{creditorAddress}</p>}
          </div>
        )}

        <div className="flex justify-between items-start mb-10">
          <h2 className="font-black text-4xl underline decoration-double text-blue-800">TERMO DE QUITAÇÃO</h2>
          {noteNumber && <span className="font-mono text-lg bg-gray-100 px-4 py-2 rounded-lg border">DOC Nº {noteNumber}</span>}
        </div>

        <div className="bg-blue-50/50 p-8 rounded-xl border border-blue-100 mb-10 space-y-4">
            <p className="text-xl leading-relaxed">
                Eu, <strong className="font-black uppercase">{creditorName}</strong>, inscrito sob o nº <strong className="font-black">{creditorCpf}</strong>, declaro para os devidos fins que recebi de <strong className="font-black uppercase">{clientName}</strong>, CPF nº <strong className="font-black">{clientCpf}</strong>, a importância total de <strong className="font-black text-2xl">{formatCurrency(totalValue)}</strong>.
            </p>
            <p className="text-xl">
                O referido valor quita integralmente a dívida representada pela Nota Promissória nº <strong className="font-black">{noteNumber}</strong>, referente a: <strong className="font-black">{productReference}</strong>.
            </p>
            <p className="text-xl font-bold italic text-blue-900 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Desta forma, dou plena, geral e irrevogável quitação de todas as obrigações deste título.
            </p>
        </div>

        <div className="space-y-6 mb-12">
            <h3 className="text-xl font-black flex items-center gap-2 border-b-2 border-gray-100 pb-2">
                <TableIcon className="h-5 w-5" />
                EXTRATO DETALHADO DE PAGAMENTOS
            </h3>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold text-black py-4">PARCELA</TableHead>
                            <TableHead className="font-bold text-black py-4">DATA DE PAGAMENTO</TableHead>
                            <TableHead className="font-bold text-black py-4 text-right">VALOR PAGO</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPayments.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium text-lg py-4">
                                    {p.installmentNumber === 0 ? "ENTRADA" : `Parcela ${p.installmentNumber}`}
                                </TableCell>
                                <TableCell className="text-lg py-4">
                                    {format(p.paymentDate instanceof Date ? p.paymentDate : (p.paymentDate as any).toDate(), "dd/MM/yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right font-black text-lg py-4">
                                    {formatCurrency(p.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-blue-50/30">
                            <TableCell colSpan={2} className="font-black text-xl py-6 text-blue-900">TOTAL FINAL PAGO</TableCell>
                            <TableCell className="text-right font-black text-2xl py-6 text-blue-900">{formatCurrency(totalPaid)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>

        <div className="mt-auto pt-16 grid grid-cols-2 gap-20">
            <div className="text-center">
                <div className="border-b-2 border-black mb-2"></div>
                <p className="font-black text-xl uppercase">{creditorName}</p>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Assinatura do Credor</p>
            </div>
            <div className="text-center">
                <div className="border-b-2 border-black mb-2"></div>
                <p className="font-black text-xl uppercase">{clientName}</p>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Assinatura do Devedor</p>
            </div>
        </div>
        
        <div className="mt-10 text-center text-xs text-gray-400 font-bold uppercase tracking-tighter">
            Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}
