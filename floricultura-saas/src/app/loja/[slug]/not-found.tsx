import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function StoreNotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto h-14 w-14" />
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Vitrine não encontrada</h1>
        <p className="mt-1 text-sm text-stone-500">Este link pode ter mudado ou a vitrine está temporariamente fechada.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">Conheça o Florescer</Link>
      </div>
    </div>
  );
}
