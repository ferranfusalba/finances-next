"use client";
import { useTransition } from "react";
import { User } from "@/types/User";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  userId: User;
};

export default function NewBudgetForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formSchema = z.object({
    name: z.string().min(1, {
      message: "Budget Name is required.",
    }),
    code: z.string().min(1, {
      message: "Budget Code is required.",
    }),
    type: z.string().min(1, {
      message: "Budget Type is required.",
    }),
    description: z.string(),
    initialBalance: z.string().min(1, {
      message: "Initial Balance is required.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "",
      description: "",
      initialBalance: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const name = values.name;
    const code = values.code;
    const active = true;
    const type = values.type;
    const description = values.description;
    const initialBalance = parseFloat(values.initialBalance);
    const userId = props.userId.id;

    startTransition(async () => {
      const res = await fetch("/api/budgets/", {
        method: "POST",
        body: JSON.stringify({
          name,
          code,
          active,
          type,
          description,
          initialBalance,
          userId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      router.push("/budgets/" + data.id);
      router.refresh();
    });
  };

  return (
    <div className="h-full flex justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 m-auto w-11/12 md:w-5/12 min-w-80 md:min-w-96"
        >
          {/* Budget Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Name</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Budget Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Code</FormLabel>
                <FormControl>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Budget Code"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Type</FormLabel>
                <FormControl>
                  <Input
                    id="type"
                    type="text"
                    placeholder="Budget Type"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Initial Balance */}
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Balance</FormLabel>
                <FormControl>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    placeholder="Initial Balance"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </form>
      </Form>
    </div>
  );
}
