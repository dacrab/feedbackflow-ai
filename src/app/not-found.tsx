import { ButtonLink, CenteredState } from "@/components/ui/ui";

export default function NotFound() {
  return (
    <CenteredState
      eyebrow="// 404"
      title="page not found"
      description="the page you&apos;re looking for doesn&apos;t exist"
      action={
        <ButtonLink href="/dashboard" size="sm">
          back to dashboard
        </ButtonLink>
      }
    />
  );
}
