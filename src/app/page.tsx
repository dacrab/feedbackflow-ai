import {
  AppPreview,
  Features,
  FinalCta,
  Hero,
  SiteFooter,
  SiteNav,
} from "@/components/marketing/sections";
import { getServerSession } from "@/lib/api";

export default async function LandingPage() {
  // Public page: a provisioning error must not break it.
  const loggedIn = await getServerSession()
    .then((session) => !!session?.user?.id)
    .catch(() => false);

  return (
    <div className="min-h-screen bg-background selection:bg-foreground/10">
      <SiteNav loggedIn={loggedIn} />
      <Hero />
      <AppPreview />
      <Features />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
