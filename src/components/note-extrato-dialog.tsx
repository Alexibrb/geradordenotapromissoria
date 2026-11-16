
"use client";

import React, { useMemo, useState } from "react";
import type { PromissoryNote, Payment } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, Calendar as CalendarIcon, Wallet2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type NoteExtratoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: PromissoryNote;
  clientName: string;
  payments: Payment[];
  onPaymentAction: (isPaid: boolean, installmentNumber: number, value: number, isDownPayment: boolean, paymentDate: Date) => void;
};

export function NoteExtratoDialog({
  open,
  onOpenChange,
  note,
  clientName,
  payments,
  onPaymentAction,
}: NoteExtratoDialogProps) {
  
  const [selectedPaymentDates, setSelectedPaymentDates] = useState<Record<number, Date>>({});

  const installmentsData = useMemo(() => {
    const list = [];
    const { paymentType, value, numberOfInstallments, hasDownPayment, downPaymentValue, paymentDate, firstInstallmentDate } = note;

    if (paymentType === 'a-vista') {
      list.push({
        label: "Parcela Única",
        installmentNumber: 1,
        dueDate: paymentDate.toDate(),
        value: value,
        isDownPayment: false
      });
    } else {
      const remainingValue = value - (downPaymentValue || 0);
      const installmentValue = numberOfInstallments > 0 ? remainingValue / numberOfInstallments : 0;
      
      if (hasDownPayment && (downPaymentValue || 0) > 0) {
        list.push({
          label: "Entrada",
          installmentNumber: 0,
          dueDate: paymentDate.toDate(),
          value: downPaymentValue || 0,
          isDownPayment: true
        });
      }

      const installmentStartDate = (hasDownPayment && firstInstallmentDate) 
        ? firstInstallmentDate.toDate() 
        : paymentDate.toDate();

      for (let i = 0; i < numberOfInstallments; i++) {
        list.push({
          label: `Parcela ${i + 1}`,
          installmentNumber: i + 1,
          dueDate: addMonths(installmentStartDate, i),
          value: installmentValue,
          isDownPayment: false
        });
      }
    }

    // Lógica de ordenação: Pendentes primeiro (Data Crescente), Pagas ao final (Data Decrescente)
    const paidList = list.filter(item => payments.some(p => p.installmentNumber === item.installmentNumber));
    const pendingList = list.filter(item => !payments.some(p => p.installmentNumber === item.installmentNumber));

    pendingList.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    paidList.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    return [...pendingList, ...paidList];
  }, [note, payments]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleDateChange = (installmentNumber: number, date: Date | undefined) => {
    if (date) {
      setSelectedPaymentDates(prev => ({ ...prev, [installmentNumber]: date }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-primary">
            <Wallet2 className="h-6 w-6" />
            Extrato de Pagamento - Nota #{note.noteNumber}
          </DialogTitle>
          <DialogDescription className="text-lg">
            Cliente: <span className="font-bold text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-bold py-4">REFERÊNCIA</TableHead>
                <TableHead className="font-bold py-4">VENCIMENTO</TableHead>
                <TableHead className="font-bold py-4">VALOR</TableHead>
                <TableHead className="font-bold py-4">STATUS</TableHead>
                <TableHead className="font-bold py-4 text-center">DATA QUITAÇÃO / AÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installmentsData.map((item) => {
                const paidInfo = payments.find(p => p.installmentNumber === item.installmentNumber);
                const isPaid = !!paidInfo;
                const currentDate = selectedPaymentDates[item.installmentNumber] || new Date();

                return (
                  <TableRow key={item.installmentNumber} className={cn(isPaid ? "bg-green-50/30 opacity-80" : "")}>
                    <TableCell className="font-bold text-base py-4">{item.label}</TableCell>
                    <TableCell className="py-4">
                      {format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-black py-4">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="py-4">
                      {isPaid ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1">
                          <CheckCircle className="h-3 w-3" /> PAGO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                          <Clock className="h-3 w-3" /> PENDENTE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {isPaid ? (
                        <div className="text-sm font-bold text-muted-foreground italic">
                          Pago em {format(paidInfo.paymentDate instanceof Date ? paidInfo.paymentDate : (paidInfo.paymentDate as any).toDate(), "dd/MM/yyyy")}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                           <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                size="sm"
                                className={cn(
                                  "w-[140px] h-9 justify-start text-left font-normal text-xs",
                                  !selectedPaymentDates[item.installmentNumber] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {format(currentDate, "dd/MM/yyyy")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(date) => handleDateChange(item.installmentNumber, date)}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <Button 
                            size="sm" 
                            className="h-9 bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={() => onPaymentAction(true, item.installmentNumber, item.value, item.isDownPayment, currentDate)}
                          >
                            Quitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
