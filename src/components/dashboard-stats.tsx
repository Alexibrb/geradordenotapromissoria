"use client"

import { useState, useEffect } from "react";
import type { PromissoryNote, Payment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type DashboardStatsProps = {
  notes: PromissoryNote[];
  payments: Payment[];
  isLoading: boolean;
  dateRange: DateRange | undefined;
  onDateChange: (dateRange: DateRange | undefined) => void;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DashboardStats({ notes, payments, isLoading, dateRange, onDateChange }: DashboardStatsProps) {
  
  const totalSales = notes.reduce((acc, note) => acc + note.value, 0);
  const totalReceived = payments.reduce((acc, payment) => acc + payment.amount, 0);
  const totalToReceive = totalSales - totalReceived;

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className="w-full sm:w-[300px] justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y", {locale: ptBR})} -{" "}
                        {format(dateRange.to, "LLL dd, y", {locale: ptBR})}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y", {locale: ptBR})
                    )
                    ) : (
                    <span>Selecione um período</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateChange}
                    numberOfMonths={2}
                    locale={ptBR}
                />
                </PopoverContent>
            </Popover>
        </div>
      {isLoading ? (
         <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                    <p className="text-xs text-muted-foreground">{notes.length} nota(s) no período</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</div>
                    <p className="text-xs text-muted-foreground">{payments.length} pagamento(s) no período</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalToReceive)}</div>
                    <p className="text-xs text-muted-foreground">Saldo pendente</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
