import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerDetails } from "./CustomerDetails"
import { Button } from "../ui/button";

// import { useForm } from "@tanstack/react-form"



type CustomerDetailsDialogProps = {
  form: any
  onCreateMyQuotationButtonClick: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailsDialog({
  form,
  onCreateMyQuotationButtonClick,
  open,
  onOpenChange
}: CustomerDetailsDialogProps) {
    return (
      <Dialog
  open={open}
  onOpenChange={onOpenChange}>
  <DialogContent>
   <CustomerDetails form={form} />
     <Button
     type='button'
     onClick={onCreateMyQuotationButtonClick}
     >
      Get My Quotation
      </Button>
  </DialogContent>

</Dialog>

    ) 
}