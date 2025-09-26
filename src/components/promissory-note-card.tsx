"use client";

import type { PromissoryNote, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown, CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

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
  const totalToReceive = note.value - totalPaid;
  
  const totalInstallments = note.numberOfInstallments + (note.hasDownPayment ? 1 : 0);
  const paidInstallments = payments.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'border-primary' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-md font-medium">
            Nota #{note.noteNumber}
          </CardTitle>
          <CardDescription className="text-xs">
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
            <p className="text-lg font-bold">
                {formatCurrency(note.value)}
            </p>
             <p className="text-xs text-muted-foreground">
                Venc. inicial: {format(note.paymentDate.toDate(), 'dd/MM/yyyy')}
            </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/50 p-2 rounded-md">
                <CardDescription className="text-xs font-semibold flex items-center justify-center gap-1"><CheckCircle className="text-green-500"/> Recebido</CardDescription>
                <p className="text-sm font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
             <div className="bg-secondary/50 p-2 rounded-md">
                <CardDescription className="text-xs font-semibold flex items-center justify-center gap-1"><TrendingDown className="text-red-500"/> A Receber</CardDescription>
                <p className="text-sm font-bold text-red-600">{formatCurrency(totalToReceive)}</p>
            </div>
             <div className="bg-secondary/50 p-2 rounded-md">
                <CardDescription className="text-xs font-semibold flex items-center justify-center gap-1"><Package /> Parcelas</CardDescription>
                <p className="text-sm font-bold">{paidInstallments}/{totalInstallments}</p>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
