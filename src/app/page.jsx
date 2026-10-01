"use client";

import Link from "next/link";
import { getDashboard } from "@/lib/api";
import { inr, qtyWithUnit } from "@/lib/format";
import { useBook } from "@/lib/use-book";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { stockStatusLabel } from "@/lib/stock-status";

const steps = [
  {
    href: "/products",
    title: "Add product",
    body: "Name, pack size, CP, SP, and opening bags on the floor.",
  },
  {
    href: "/stock-in",
    title: "Buy / Stock in",
    body: "Supplier bill. Quantity goes up. Rate becomes the latest CP.",
  },
  {
    href: "/stock-out",
    title: "Sell / Stock out",
    body: "Shop bill. Quantity goes down. Margin shows before you post.",
  },
];

export default function DashboardPage() {
  const { data, error, loading, reload } = useBook(getDashboard);

  return (
    <div className="rise-in">
      <PageHeader
        title="Godown today"
        lede="Simple counter flow: add the bag to the book, buy stock in, sell stock out. No GST, no ledger — only what is on hand."
      />
      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <div className="space-y-8">
          <section className="rise-in rise-in-delay-1">
            <h2 className="mb-3 font-heading text-2xl font-semibold tracking-tight">
              How the counter works
            </h2>
            <ol className="grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.href}>
                  <Link
                    href={step.href}
                    className="block h-full rounded-2xl border border-border bg-card/90 p-5 transition-transform hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{step.title}</p>
                    <p className="mt-2 text-base text-muted-foreground">{step.body}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 rise-in rise-in-delay-2">
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
              Buy / Stock in
            </Link>
            <Link
              href="/stock-out"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-16 text-lg",
              )}
            >
              Sell / Stock out
            </Link>
          </div>

          <section className="rise-in rise-in-delay-3">
            <h2 className="mb-3 font-heading text-2xl font-semibold tracking-tight">
              Needs a reorder
            </h2>
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
                          <Badge variant="destructive">
                            {stockStatusLabel(product.stockStatus || "low")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-lg">
                        On hand{" "}
                        <span className="font-semibold tabular-nums">
                          {qtyWithUnit(product.stockQty, product.unit)}
                        </span>
                        . Reorder at {qtyWithUnit(product.reorderLevel, product.unit)}.
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

function Metric({ label, value, note, emphasize = false }) {
  return (
    <Card className={emphasize ? "bg-accent/80" : "bg-card/90"}>
      <CardHeader>
        <CardDescription className="text-base">{label}</CardDescription>
        <CardTitle className="font-heading text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-base text-muted-foreground">{note}</CardContent>
    </Card>
  );
}
