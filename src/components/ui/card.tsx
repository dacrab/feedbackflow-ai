type CardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`rounded border border-border bg-card p-4 space-y-4 ${className}`}>
      <p className="text-xs text-muted-foreground">// {title}</p>
      {children}
    </div>
  );
}
