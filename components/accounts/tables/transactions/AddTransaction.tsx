import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountTransaction } from "@/types/Transaction";

interface Props {
  accountId: number;
}

export const AddTransaction = (props: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: 0,
      concept: "",
      type: "",
      currency: "EUR",
      notes: "",
    },
  });

  const onSubmit = async (data: AccountTransaction) => {
    const amount = parseFloat(data.amount);
    const concept = data.concept;
    const type = data.type;
    const currency = data.currency;
    const notes = data.notes;
    const accountId = props.accountId;

    await fetch("/api/accounts/transactions/", {
      method: "POST",
      body: JSON.stringify({
        amount,
        concept,
        type,
        currency,
        notes,
        accountId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Close Modal & rerender table
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a transaction to this account:
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Import
              </Label>
              <Input
                id="amount"
                type="text"
                className="col-span-3"
                {...register("amount", {
                  required: true,
                })}
              />
              {errors.amount && <p>This field is required</p>}
            </div>
            {/* Concept */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concept" className="text-right">
                Concept
              </Label>
              <Input
                id="concept"
                type="text"
                className="col-span-3"
                {...register("concept", {
                  required: true,
                })}
              />
              {errors.concept && <p>This field is required</p>}
            </div>
            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Input
                id="type"
                type="text"
                className="col-span-3"
                {...register("type", {
                  required: true,
                })}
              />
              {errors.type && <p>This field is required</p>}
            </div>
            {/* Currency */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Input
                id="currency"
                type="text"
                className="col-span-3"
                defaultValue="EUR"
                {...register("currency", {
                  required: true,
                })}
              />
              {errors.currency && <p>This field is required</p>}
            </div>
            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                type="text"
                className="col-span-3"
                {...register("notes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
