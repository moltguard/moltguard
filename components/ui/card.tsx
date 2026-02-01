export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

export function CardValue({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
      {children}
    </p>
  );
}
