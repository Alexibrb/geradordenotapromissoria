import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

type InstallmentSlipProps = {
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  clientName: string;
  productReference: string;
};

export function InstallmentSlip({
  installmentNumber,
  totalInstallments,
  value,
  dueDate,
  clientName,
  productReference,
}: InstallmentSlipProps) {

  const handlePrint = () => {
    const printContent = document.getElementById(`slip-${installmentNumber}`);
    if (printContent) {
      printContent.classList.add("print-container");
      window.print();
      printContent.classList.remove("print-container");
    }
  };

  return (
    <div id={`slip-${installmentNumber}`} className="bg-card border-2 border-dashed rounded-lg p-4 print-break-inside-avoid">
      <div className="flex justify-between items-start text-sm">
        <h3 className="font-bold text-lg">Payment Slip</h3>
        <div className="text-right">
          <p className="font-semibold">Installment</p>
          <p>{installmentNumber} of {totalInstallments}</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Client Name</p>
          <p className="font-semibold">{clientName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reference</p>
          <p className="font-semibold">{productReference}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Due Date</p>
          <p className="font-semibold">{format(dueDate, "MM/dd/yyyy")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Amount Due</p>
          <p className="font-bold text-lg text-primary">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(value)}
          </p>
        </div>
      </div>
      <Separator orientation="horizontal" className="border-dashed my-4" />
      <div className="text-xs text-muted-foreground">
        <p>This is a promissory note slip. Payment must be made on or before the due date. </p>
        <p>For inquiries, please contact us with your reference details.</p>
      </div>
    </div>
  );
}
