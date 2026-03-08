"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      position="top-center"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          default: "!border-border",
          success: "!bg-green-950 !border-green-900 !text-green-100",
          error: "!bg-red-950 !border-red-900 !text-red-100",
          warning: "!bg-yellow-950 !border-yellow-900 !text-yellow-100",
          info: "!bg-blue-950 !border-blue-900 !text-blue-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
