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

export const AddTransaction = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      import: null,
      concept: "",
      type: "",
      currency: "EUR",
      notes: "",
    },
  });

  // console.log(watch("example"));

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
        <form
          onSubmit={handleSubmit((data) => {
            alert(JSON.stringify(data));
          })}
        >
          <div className="grid gap-4 py-4">
            {/* Import */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="import" className="text-right">
                Import
              </Label>
              <Input
                id="import"
                className="col-span-3"
                {...register("import", {
                  required: true,
                })}
              />
              {errors.import && <p>This field is required</p>}
            </div>
            {/* Concept */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concept" className="text-right">
                Concept
              </Label>
              <Input
                id="concept"
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
              <Input id="notes" className="col-span-3" {...register("notes")} />
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
