import Link from "next/link";
import { CenteredState } from "@/components/ui/ui";

export default function NotFound() {
  return (
    <CenteredState
      eyebrow="// 404"
      title="page not found"
      description="the page you&apos;re looking for doesn&apos;t exist"
      action={
        <Link
          href="/dashboard"
          className="inline-block h-8 leading-8 px-4 rounded bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          back to dashboard
        </Link>
      }
    />
  );
}
