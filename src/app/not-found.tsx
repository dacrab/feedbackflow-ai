import { ButtonLink, CenteredState } from "@/components/ui/ui";

export default function NotFound() {
  return (
    <CenteredState
      eyebrow="404"
      title="page not found"
      description="the page you're looking for doesn't exist"
      action={<ButtonLink href="/dashboard">back to dashboard</ButtonLink>}
    />
  );
}
