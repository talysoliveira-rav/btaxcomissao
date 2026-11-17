/** Esqueleto mostrado na hora enquanto a página carrega. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-page">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-7 w-56 rounded-lg" />
        <div className="skeleton h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="surface rounded-2xl border p-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton mt-3 h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>
      <div className="surface mt-6 rounded-2xl border p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-stone-200/50 py-3 last:border-0">
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-1/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
