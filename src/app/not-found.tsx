import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-mono">
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">// 404</p>
        <h1 className="text-xl font-medium">page not found</h1>
        <p className="text-sm text-muted-foreground">
          the page you&apos;re looking for doesn&apos;t exist
        </p>
        <Link
          href="/dashboard"
          className="inline-block h-8 leading-8 px-4 rounded bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          back to dashboard
        </Link>
      </div>
    </div>
  );
}
