import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, lede }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-lg leading-snug text-muted-foreground">{lede}</p>
    </header>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-2xl font-semibold">Opening the stock book…</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}

) {
  return (
    <Alert variant="destructive" className="px-4 py-4">
      <AlertTitle className="text-lg">The counter cannot reach the stock book</AlertTitle>
      <AlertDescription className="text-base">
        <p>{message}</p>
        <Button type="button" variant="outline" className="mt-3 h-12 px-4 text-base" onClick={onRetry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10">
      <p className="text-2xl font-semibold tracking-tight">{title}</p>
      <p className="mt-2 max-w-xl text-lg text-muted-foreground">{body}</p>
    </div>
  );
}
