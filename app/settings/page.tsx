import Link from "next/link";

import Layout02b from "@/components/layouts/Layout02b";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const sections = [
  {
    href: "/settings/user",
    title: "User",
    description:
      "Profile, security, preferences, and appearance settings.",
  },
  {
    href: "/settings/tax-presets",
    title: "Tax Presets",
    description:
      "Default tax rates for categories and subcategories.",
  },
];

export default function SettingsPage() {
  return (
    <Layout02b>
      <div className="w-full h-full p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout02b>
  );
}
