"use client";
import { Printer } from "lucide-react";
import { Button } from "./ui";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button variant="secondary" type="button" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden /> {label}
    </Button>
  );
}
