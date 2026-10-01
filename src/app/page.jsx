"use client";

import Link from "next/link";
import { getDashboard } from "@/lib/api";
import { inr, qty } from "@/lib/format";
import { useBook } from "@/lib/use-book";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";

export default function DashboardPage() {
  const { data, error, loading, reload } = useBook(getDashboard);

  return (
    <div>
      <PageHeader
        title="Godown today"
        lede="What the bags on the floor are worth, what came in, and what went out to other shops."
      />
      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric
              label="Stock value at cost"
              value={inr(data.stockValueAtCp)}
              note="Cost price times the quantity still in the godown."
            />
            <Metric
              label="Stock value at selling price"
              value={inr(data.stockValueAtSp)}
              note="What the same bags would fetch at today's SP."
            />
            <Metric
              label="Bought today"
              value={inr(data.todayPurchaseTotal)}
              note="Purchase vouchers dated today, at the rate on the bill."
            />
            <Metric
              label="Sold today"
              value={inr(data.todaySalesTotal)}
              note="Sales vouchers dated today, at the rate we charged."
            />
            <Metric
              label="Gross margin today"
              value={inr(data.grossMargin)}
              note="Today's sales minus the cost price on each bag when it left."
              emphasize
            />
            <Metric
              label="Low stock"
              value={String(data.lowStock.length)}
              note="Products at or under their reorder level."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/stock-in"
              className={cn(buttonVariants({ size: "lg" }), "h-16 text-lg")}
            >
              Stock in (we bought)
            </Link>
            <Link
              href="/stock-out"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-16 text-lg",
              )}
            >
              Stock out (we sold)
            </Link>
          </div>

          <section>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight">Needs a reorder</h2>
            {data.lowStock.length === 0 ? (
              <EmptyState
                title="Nothing is at reorder"
                body="The godown is covered for now. Low stock shows up here when a product is at or under its reorder level."
              />
            ) : (
              <ul className="grid gap-3">
                {data.lowStock.map((product) => (
                  <li key={product.id}>
                    <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">{product.name}</CardTitle>
                          <CardDescription className="text-base">
                            {product.categoryName}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Low</Badge>
                      </div>
                    </CardHeader>
                      <CardContent className="text-lg">
                        On hand{" "}
                        <span className="font-semibold tabular-nums">
                          {qty(product.stockQty)} {product.unit}
                        </span>
                        . Reorder at {qty(product.reorderLevel)}.
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  emphasize = false,
}

) {
  return (
    <Card className={emphasize ? "bg-accent" : undefined}>
      <CardHeader>
        <CardDescription className="text-base">{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-base text-muted-foreground">{note}</CardContent>
    </Card>
  );
}
