"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExtendedUser } from "@/next-auth";
import Link from "next/link";
import { logout } from "@/actions/logout";

interface UserDropdownMenuProps {
  user: ExtendedUser;
}

export function UserDropdownMenu({ user }: UserDropdownMenuProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.metaKey && e.key === "Q") {
        e.preventDefault();
        logout();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.image!} />
          <AvatarFallback>{user.name![0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuLabel className="font-mono font-normal">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/billing">
            <DropdownMenuItem disabled>Billing</DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Support</DropdownMenuItem>
        {user.role === "ADMIN" && (
          <Link href="/playground">
            <DropdownMenuItem>Playground</DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-mono font-normal text-muted-foreground">
          v{process.env.APP_VERSION}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
