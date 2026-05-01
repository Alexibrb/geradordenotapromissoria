
"use client";

import type { PromissoryNote, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown, CheckCircle, Package, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type PromissoryNoteCardProps = {
  note: PromissoryNote;
  payments: Payment[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

export function PromissoryNoteCard({ note, payments, isSelected, onSelect, onEdit, onDelete }: PromissoryNoteCardProps) {

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalToReceive = Math.max(0, note.value - totalPaid);
  
  const totalInstallments = note.numberOfInstallments + (note.hasDownPayment ? 1 : 0);
  const paidInstallments = payments.length;
  
  // Consideramos quitada se o valor a receber for zero (com margem de erro decimal) 
  // e se o número de pagamentos for igual ao total esperado
  const isFullyPaid = totalToReceive < 0.01 && paidInstallments >= totalInstallments && totalInstallments > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-2",
        isSelected ? 'border-primary shadow-blue-100 shadow-lg' : 'border-transparent',
        isFullyPaid ? 'bg-blue-50/40 border-blue-200' : 'bg-card'
      )}
      onClick={onSelect}
    >
      {isFullyPaid && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-md animate-in slide-in-from-top-full duration-500">
            <CheckCircle className="h-3 w-3" />
            QUITADA
          </div>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1 pr-6">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            Nota #{note.noteNumber}
            {isFullyPaid && <PartyPopper className="h-5 w-5 text-blue-600 animate-bounce" />}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-1 italic">
            {note.productServiceReference}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
            <p className={cn("text-lg font-black", isFullyPaid ? "text-blue-700" : "text-foreground")}>
                {formatCurrency(note.value)}
            </p>
             <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                Início: {format(note.paymentDate.toDate(), 'dd/MM/yy')}
            </p>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className={cn("p-2 rounded-md border", isFullyPaid ? "bg-white/80 border-blue-100" : "bg-secondary/50 border-transparent")}>
                <CardDescription className="text-[9px] font-bold flex items-center justify-center gap-1 uppercase tracking-tighter">
                    <CheckCircle className="h-3 w-3 text-blue-500"/> Recebido
                </CardDescription>
                <p className="text-xs font-black text-blue-600">{formatCurrency(totalPaid)}</p>
            </div>
             <div className={cn("p-2 rounded-md border", isFullyPaid ? "bg-white/80 border-blue-100" : "bg-secondary/50 border-transparent")}>
                <CardDescription className="text-[9px] font-bold flex items-center justify-center gap-1 uppercase tracking-tighter">
                    <TrendingDown className={cn("h-3 w-3", totalToReceive > 0 ? "text-red-500" : "text-blue-500")}/> A Receber
                </CardDescription>
                <p className={cn("text-xs font-black", totalToReceive > 0 ? "text-red-600" : "text-blue-600")}>
                    {formatCurrency(totalToReceive)}
                </p>
            </div>
             <div className={cn("p-2 rounded-md border", isFullyPaid ? "bg-white/80 border-blue-100" : "bg-secondary/50 border-transparent")}>
                <CardDescription className="text-[9px] font-bold flex items-center justify-center gap-1 uppercase tracking-tighter">
                    <Package className="h-3 w-3" /> Parcelas
                </CardDescription>
                <p className="text-xs font-black">{paidInstallments}/{totalInstallments}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
