"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  User,
  MapPin,
  Phone,
  Barcode,
  CircleDollarSign,
  Calendar as CalendarIcon,
  Hash,
  Send,
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
  clientName: z.string().min(3, { message: "Name must be at least 3 characters." }),
  clientAddress: z.string().min(10, { message: "Please enter a full, valid address." }),
  clientContact: z.string().min(7, { message: "Please enter a valid phone or email." }),
  productReference: z.string().min(2, { message: "Please enter a product reference." }),
  totalValue: z.coerce.number().positive({ message: "Value must be a positive number." }),
  paymentDate: z.date({ required_error: "A payment start date is required." }),
  installments: z.coerce.number().int().min(1, { message: "At least one installment is required." }).max(120, { message: "Cannot exceed 120 installments." }),
});

type PromissoryNoteFormProps = {
  onGenerate: (data: PromissoryNoteData) => void;
};

export function PromissoryNoteForm({ onGenerate }: PromissoryNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientAddress: "",
      clientContact: "",
      productReference: "",
      totalValue: undefined,
      installments: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onGenerate(values);
    toast({
      title: "Documents Generated!",
      description: "Your promissory note and payment booklet are ready.",
      className: "bg-accent text-accent-foreground",
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Enter Details</CardTitle>
        <CardDescription>Provide the necessary information to create the documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" /> Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Client Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown, USA" {...field} />
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
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Client Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com or (555) 123-4567" {...field} />
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
                  <FormLabel className="flex items-center"><Barcode className="mr-2 h-4 w-4" /> Product/Service Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice #12345" {...field} />
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
                    <FormLabel className="flex items-center"><CircleDollarSign className="mr-2 h-4 w-4" /> Total Value ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000.00" {...field} />
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
                    <FormLabel className="flex items-center"><Hash className="mr-2 h-4 w-4" /> Installments</FormLabel>
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
                  <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> First Payment Date</FormLabel>
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
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg">
              Generate Documents
              <Send className="ml-2 h-4 w-4"/>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
