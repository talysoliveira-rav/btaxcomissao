"use client";
import { Button } from "./ui";
import type { ComponentProps } from "react";

/** Botão de submit que pede confirmação antes. */
export function ConfirmButton({ message, ...p }: ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      type="submit"
      {...p}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    />
  );
}
