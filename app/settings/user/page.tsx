"use client";

import { useTransition, useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";

import { settings } from "@/actions/settings";

import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import Layout02b from "@/components/layouts/Layout02b";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCurrentUser } from "@/hooks/use-current-user";

import { UserRole } from "@prisma/client";

import { SettingsSchema } from "@/schemas";
import { ModeToggle } from "@/components/nav/TopNav/components/ModeToggle/ModeToggle";

import countries from "@/statics/countries.json";
import currencies from "@/statics/currencies.json";

import { Currency } from "@/types/Currency";
import { Country } from "@/types/Country";

const UserPage = () => {
  const user = useCurrentUser();

  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
      role: user?.role || undefined,
      defaultCountry: user?.defaultCountry || undefined,
      defaultCurrency: user?.defaultCurrency || undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Something went wrong"));
    });
  };

  return (
    <Layout02b>
      <Card className="md:w-[600px]">
        <CardHeader>
          <p className="text-2xl font-semibold text-center">⚙️ Settings</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              action=""
              className="space-y-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          disabled={isPending}
                        ></Input>
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                {user?.isOAuth === false && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="john.doe@example.com"
                              disabled={isPending}
                              type="email"
                            ></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                        </FormItem>
                      )}
                    ></FormField>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="*******"
                              disabled={isPending}
                              type="password"
                            ></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                        </FormItem>
                      )}
                    ></FormField>
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="*******"
                              disabled={isPending}
                              type="password"
                            ></Input>
                          </FormControl>
                          <FormMessage></FormMessage>
                        </FormItem>
                      )}
                    ></FormField>
                  </>
                )}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  control={form.control}
                  name="defaultCountry"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          disabled={isPending}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country"></SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country: Country) => (
                              <SelectItem
                                value={country["alpha-2"]}
                                key={country["alpha-2"]}
                              >
                                {country["alpha-2"]} {country["emoji-flag"]}{" "}
                                {"  "}
                                {country.name}
                                {"  "}
                                {country["full-name"] &&
                                  "(" + country["full-name"] + ")"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage></FormMessage>
                      </FormItem>
                    );
                  }}
                ></FormField>
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency"></SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency: Currency) => (
                            <SelectItem
                              value={currency.code}
                              key={currency.code}
                            >
                              {currency.code} - {currency.name} (
                              {currency.symbol_native})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                ></FormField>
                <div className="flex flex-col gap-2">
                  <FormLabel>Theme</FormLabel>
                  <ModeToggle />
                </div>
              </div>
              <FormError message={error}></FormError>
              <FormSuccess message={success}></FormSuccess>
              <Button disabled={isPending} type="submit">
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout02b>
  );
};

export default UserPage;
