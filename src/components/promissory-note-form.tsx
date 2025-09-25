"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  MapPin,
  Phone,
  Barcode,
  CircleDollarSign,
  Calendar as CalendarIcon,
  Hash,
  Send,
  Briefcase,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { PromissoryNoteData } from "@/types";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  creditorName: z.string().min(3, { message: "O nome do credor deve ter pelo menos 3 caracteres." }),
  clientName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  clientAddress: z.string().min(10, { message: "Por favor, insira um endereço completo e válido." }),
  clientContact: z.string().min(7, { message: "Por favor, insira um telefone ou e-mail válido." }),
  productReference: z.string().min(2, { message: "Por favor, insira uma referência do produto." }),
  totalValue: z.coerce.number().positive({ message: "O valor deve ser um número positivo." }),
  paymentDate: z.date({ required_error: "A data de início do pagamento é obrigatória." }),
  installments: z.coerce.number().int().min(1, { message: "É necessária pelo menos uma parcela." }).max(120, { message: "Não pode exceder 120 parcelas." }),
});

type PromissoryNoteFormProps = {
  onGenerate: (data: PromissoryNoteData) => void;
};

export function PromissoryNoteForm({ onGenerate }: PromissoryNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditorName: "",
      clientName: "",
      clientAddress: "",
      clientContact: "",
      productReference: "",
      totalValue: "" as unknown as number,
      installments: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onGenerate(values);
    toast({
      title: "Documentos Gerados!",
      description: "Sua nota promissória e carnê de pagamento estão prontos.",
      className: "bg-accent text-accent-foreground",
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Insira os Detalhes</CardTitle>
        <CardDescription>Forneça as informações necessárias para criar os documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="creditorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4" /> Nome do Credor</FormLabel>
                  <FormControl>
                    <Input placeholder="Sua Empresa LTDA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" /> Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Endereço do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua Principal, 123, Cidade, Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Contato do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com ou (11) 98765-4321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Barcode className="mr-2 h-4 w-4" /> Referência do Produto/Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Fatura #12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CircleDollarSign className="mr-2 h-4 w-4" /> Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Hash className="mr-2 h-4 w-4" /> Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> Data do Primeiro Pagamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0,0,0,0))
                        }
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg">
              Gerar Documentos
              <Send className="ml-2 h-4 w-4"/>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
