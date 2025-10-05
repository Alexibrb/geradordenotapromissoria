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
  Fingerprint,
  Wallet,
  FileWarning,
} from "lucide-react";
import { useEffect } from 'react';

import { cn } from "@/lib/utils";
import type { PromissoryNoteData, UserSettings } from "@/types";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";


const formSchema = z.object({
  header: z.string().optional(),
  creditorName: z.string(),
  creditorCpf: z.string(),
  creditorAddress: z.string(),
  clientName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  clientCpf: z.string().min(11, { message: "O CPF do cliente deve ter 11 dígitos." }),
  clientAddress: z.string().min(10, { message: "Por favor, insira um endereço completo e válido." }),
  clientContact: z.string().optional(),
  productReference: z.string().min(2, { message: "Por favor, insira uma referência do produto." }),
  totalValue: z.coerce.number().positive({ message: "O valor deve ser um número positivo." }),
  paymentDate: z.date({ required_error: "A data de início do pagamento é obrigatória." }),
  installments: z.coerce.number().int().min(1, { message: "É necessária pelo menos uma parcela." }),
  paymentType: z.enum(['a-vista', 'a-prazo'], { required_error: "Selecione o tipo de pagamento."}),
  hasDownPayment: z.boolean().optional(),
  downPaymentValue: z.coerce.number().optional(),
  latePaymentClause: z.string().optional(),
}).refine(data => {
    if (data.paymentType === 'a-prazo' && data.hasDownPayment) {
        return data.downPaymentValue && data.downPaymentValue > 0;
    }
    return true;
}, {
    message: "O valor da entrada é obrigatório.",
    path: ["downPaymentValue"],
}).refine(data => {
    if (data.paymentType === 'a-prazo' && data.hasDownPayment && data.downPaymentValue) {
        return data.downPaymentValue < data.totalValue;
    }
    return true;
}, {
    message: "A entrada não pode ser maior ou igual ao valor total.",
    path: ["downPaymentValue"],
});

type PromissoryNoteFormProps = {
  onGenerate: (data: PromissoryNoteData) => void;
  client?: { id: string; name: string, address: string, cpf: string, contactInformation: string };
  initialData?: PromissoryNoteData;
  settings?: UserSettings;
  isEditing?: boolean;
};

export function PromissoryNoteForm({ onGenerate, client, initialData, settings, isEditing = false }: PromissoryNoteFormProps) {
  const { toast } = useToast();
  
  const getSafeInitialData = (data?: PromissoryNoteData, currentSettings?: UserSettings) => {
    const defaults = {
      header: currentSettings?.header || "",
      creditorName: currentSettings?.creditorName || "",
      creditorCpf: currentSettings?.creditorCpf || "",
      creditorAddress: currentSettings?.creditorAddress || "",
      clientName: client?.name || "",
      clientCpf: client?.cpf || "",
      clientAddress: client?.address || "",
      clientContact: client?.contactInformation || "",
      productReference: "",
      totalValue: 0,
      paymentType: "a-prazo" as const,
      installments: 1,
      paymentDate: new Date(),
      hasDownPayment: false,
      downPaymentValue: 0,
      latePaymentClause: "O atraso nos pagamentos por até 03 meses, acarretará na perda da propriedade e posse do imóvel, sem fazer jus a indenização ou ressarcimento de valores já efetuados pelo comprador.",
    };

    if (!data) return defaults;

    return {
      header: data.header || defaults.header,
      creditorName: data.creditorName || defaults.creditorName,
      creditorCpf: data.creditorCpf || defaults.creditorCpf,
      creditorAddress: data.creditorAddress || defaults.creditorAddress,
      clientName: data.clientName || defaults.clientName,
      clientCpf: data.clientCpf || defaults.clientCpf,
      clientAddress: data.clientAddress || defaults.clientAddress,
      clientContact: data.clientContact || defaults.clientContact,
      productReference: data.productReference || defaults.productReference,
      totalValue: data.totalValue || defaults.totalValue,
      paymentType: data.paymentType || defaults.paymentType,
      installments: data.installments || defaults.installments,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : defaults.paymentDate,
      hasDownPayment: data.hasDownPayment || defaults.hasDownPayment,
      downPaymentValue: data.downPaymentValue || defaults.downPaymentValue,
      latePaymentClause: data.latePaymentClause || defaults.latePaymentClause,
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getSafeInitialData(initialData, settings),
  });
  
  const paymentType = form.watch("paymentType");
  const hasDownPayment = form.watch("hasDownPayment");

  useEffect(() => {
    form.reset(getSafeInitialData(initialData, settings));
  }, [initialData, settings, form]);
  
  useEffect(() => {
    if (paymentType === 'a-vista') {
        form.setValue('installments', 1);
        form.setValue('hasDownPayment', false);
    }
  }, [paymentType, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToGenerate = {...values};
    if (dataToGenerate.paymentType === 'a-vista') {
        dataToGenerate.installments = 1;
        dataToGenerate.hasDownPayment = false;
        dataToGenerate.downPaymentValue = 0;
        dataToGenerate.latePaymentClause = '';
    } else if (!dataToGenerate.hasDownPayment) {
        dataToGenerate.downPaymentValue = 0;
    }
    
    onGenerate(dataToGenerate);

    if (!isEditing) {
      toast({
        title: "Documentos Gerados!",
        description: "Sua nota promissória e carnê de pagamento estão prontos.",
        className: "bg-accent text-accent-foreground",
      });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{isEditing ? 'Edite os Detalhes da Nota' : 'Insira os Detalhes da Nota'}</CardTitle>
        <CardDescription>Forneça as informações necessárias para {isEditing ? 'atualizar' : 'criar'} os documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" /> Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} disabled={!!client && !isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="clientCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4" /> CPF do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="123.456.789-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Endereço do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua Principal, 123, Cidade, Estado" {...field} disabled={!!client && !isEditing} />
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
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Contato do Cliente (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com ou (11) 98765-4321" {...field} disabled={!!client && !isEditing} />
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
            
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center"><Wallet className="mr-2 h-4 w-4" /> Tipo de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="a-prazo" />
                        </FormControl>
                        <FormLabel className="font-normal">A Prazo</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="a-vista" />
                        </FormControl>
                        <FormLabel className="font-normal">À Vista</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {paymentType === 'a-prazo' && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="hasDownPayment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Pagamento com Entrada?</FormLabel>
                        <FormDescription>
                          Marque se haverá um valor de entrada.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {hasDownPayment && (
                    <FormField
                    control={form.control}
                    name="downPaymentValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><CircleDollarSign className="mr-2 h-4 w-4" /> Valor da Entrada (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="200,00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Hash className="mr-2 h-4 w-4" /> Número de Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="latePaymentClause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><FileWarning className="mr-2 h-4 w-4" /> Cláusula de Atraso de Pagamento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite aqui a cláusula que aparecerá na nota em caso de pagamento a prazo..."
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta cláusula só será exibida na nota se o tipo de pagamento for 'A Prazo'.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> Data do {paymentType === 'a-prazo' ? (hasDownPayment ? 'Pagamento da Entrada' : 'Primeiro Pagamento') : 'Pagamento'}</FormLabel>
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
              {isEditing ? 'Salvar Alterações' : 'Gerar Documentos'}
              <Send className="ml-2 h-4 w-4"/>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
