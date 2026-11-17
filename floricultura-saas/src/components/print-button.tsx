"use client";
import { Button } from "./ui";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button variant="secondary" type="button" onClick={() => window.print()}>
      🖨️ {label}
    </Button>
  );
}
