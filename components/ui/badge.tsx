const variants: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  critical: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
  email: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  webpage: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: string;
}) {
  const classes = variants[variant] || variants.default;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}
