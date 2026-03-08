"use client";

import { useTransition, useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut, useSession } from "next-auth/react";

import { settings } from "@/actions/settings";

import { toast } from "sonner";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TwoFactorSection } from "@/components/auth/two-factor-section";

import countries from "@/statics/countries.json";
import currencies from "@/statics/currencies.json";
import timezones from "@/statics/timezones.json";

import { Currency } from "@/types/Currency";
import { Country } from "@/types/Country";
import { Timezone } from "@/types/Timezone";

const UserPage = () => {
  const user = useCurrentUser();

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
      userCountry: user?.userCountry || undefined,
      userCurrency: user?.userCurrency || undefined,
      userTimezone: user?.userTimezone || undefined,
      userLocale: user?.userLocale || undefined,
      weekStartsOn: user?.weekStartsOn ?? 0,
    },
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            toast.error("Failed to save settings", { description: data.error });
          }

          if (data.success) {
            if ("passwordChanged" in data) {
              signOut();
              return;
            }
            update();
            toast.success(data.success);
          }
        })
        .catch(() => toast.error("Something went wrong"));
    });
  };

  return (
    <Layout02b>
      <div className="w-full h-full p-4 md:p-8">
        <Form {...form}>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
            aria-busy={isPending}
          >
            {/* Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {user?.isOAuth === false && (
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Security */}
            {user?.isOAuth === false && (
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <TwoFactorSection
                    initialEnabled={user?.twoFactorEnabled ?? false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={UserRole.USER}>User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userCountry"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Country</FormLabel>
                        {!user?.preferencesSet && (
                          <Badge variant="secondary">Detected</Badge>
                        )}
                      </div>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userCurrency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Currency</FormLabel>
                        {!user?.preferencesSet && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userTimezone"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Timezone</FormLabel>
                        {!user?.preferencesSet && (
                          <Badge variant="secondary">Detected</Badge>
                        )}
                      </div>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones
                            .filter(
                              (tz: Timezone, i: number, arr: Timezone[]) =>
                                tz.utc.length > 0 &&
                                arr.findIndex((t) => t.utc[0] === tz.utc[0]) ===
                                  i
                            )
                            .map((timezone: Timezone) => (
                              <SelectItem
                                value={timezone.utc[0]}
                                key={timezone.utc[0]}
                              >
                                {timezone.text} - {timezone.value}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userLocale"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Locale</FormLabel>
                        {!user?.preferencesSet && (
                          <Badge variant="secondary">Detected</Badge>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="en-US, es-ES, ca-AD..."
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weekStartsOn"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Week starts on</FormLabel>
                      <Select
                        disabled={isPending}
                        onValueChange={(v) => field.onChange(Number(v))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <ModeToggle />
              </CardContent>
            </Card>

            <div className="md:col-span-2">
              <Button disabled={isPending} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout02b>
  );
};

export default UserPage;
