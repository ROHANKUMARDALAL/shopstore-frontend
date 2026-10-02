import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, lede, className }) {
  return (
    <header className={className || "mb-5"}>
      <h1 className="font-heading text-2xl tracking-tight text-foreground md:text-[1.75rem]">
        {title}
      </h1>
      {lede ? (
        <p className="mt-1.5 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground md:text-[0.95rem]">
          {lede}
        </p>
      ) : null}
    </header>
  );
}

export function LoadingState({ label = "Loading stock book…" }) {
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card px-6 py-12"
      role="status"
      aria-live="polite"
    >
      <div className="page-loader-ring" aria-hidden />
      <div className="page-loader-bar" aria-hidden />
      <p className="text-sm font-normal tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Alert variant="destructive" className="px-4 py-4">
      <AlertTitle className="text-base font-medium">Cannot reach the stock book</AlertTitle>
      <AlertDescription className="text-sm font-light">
        <p>{message}</p>
        <Button type="button" variant="outline" className="mt-3 h-10 px-4 text-sm" onClick={onRetry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10">
      <p className="font-heading text-xl tracking-tight">{title}</p>
      <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
