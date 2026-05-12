"use client";

export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center p-8 font-mono">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-medium">something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {process.env.NODE_ENV === "development" ? error.message : "an unexpected error occurred"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="h-8 px-4 rounded bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          try again
        </button>
      </div>
    </div>
  );
}
