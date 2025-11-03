/**
 * Reusable OAuth provider buttons component
 */

import Button from "@/components/ui/button";
import { GitHubIcon, GoogleIcon } from "@/components/ui/icons";

type OAuthProvider = "github" | "google";

interface OAuthProvidersProps {
  onProviderClick: (provider: OAuthProvider) => void;
  disabled?: boolean;
}

export default function OAuthProviders({ onProviderClick, disabled = false }: OAuthProvidersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          className="w-full"
          disabled={disabled}
          onClick={() => onProviderClick("github")}
          variant="outline"
        >
          <GitHubIcon className="h-4 w-4" /> GitHub
        </Button>
        <Button
          type="button"
          className="w-full"
          disabled={disabled}
          onClick={() => onProviderClick("google")}
          variant="outline"
        >
          <GoogleIcon className="h-4 w-4" /> Google
        </Button>
      </div>
    </div>
  );
}
