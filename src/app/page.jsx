"use client";

import Link from "next/link";
import { getDashboard } from "@/lib/api";
import { inr, qtyWithUnit } from "@/lib/format";
import { gstLabel } from "@/lib/gst";
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
    title: "Products + HSN",
    body: "Unique HSN, GST rate, pack size, CP/SP.",
  },
  {
    href: "/stock-in",
    title: "Stock in",
    body: "Buy by HSN. Optional e-way bill on the lorry.",
  },
  {
    href: "/stock-out",
    title: "Stock out",
    body: "Sell by HSN. Margin + GST + e-way bill.",
  },
];

export default function DashboardPage() {
  const { data, error, loading, reload } = useBook(getDashboard);

  return (
    <div className="rise-in">
      <PageHeader
        title="Godown today"
        lede="Clean counter: HSN-wise stock, GST per product, margin, aur e-way bill jab chahiye."
      />
      {loading && !data ? <LoadingState label="Loading dashboard…" /> : null}
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Counter flow
            </h2>
            <ol className="grid gap-2 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.href}>
                  <Link
                    href={step.href}
                    className="block h-full rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <p className="text-[11px] font-medium tracking-wide text-primary uppercase">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium">{step.title}</p>
                    <p className="mt-1 text-xs font-light text-muted-foreground">{step.body}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="Stock value at cost" value={inr(data.stockValueAtCp)} note="CP × qty on hand" />
            <Metric
              label="Stock value at selling price"
              value={inr(data.stockValueAtSp)}
              note="SP × qty on hand"
            />
            <Metric label="Bought today" value={inr(data.todayPurchaseTotal)} note="Taxable purchase total" />
            <Metric label="Sold today" value={inr(data.todaySalesTotal)} note="Taxable sales total" />
            <Metric
              label="Gross margin today"
              value={inr(data.grossMargin)}
              note="Sales minus CP at sale"
              emphasize
            />
            <Metric label="Low stock" value={String(data.lowStock.length)} note="At or under reorder" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/stock-in" className={cn(buttonVariants({ size: "lg" }), "h-11 text-sm font-normal")}>
              Stock in
            </Link>
            <Link
              href="/stock-out"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-11 text-sm font-normal")}
            >
              Stock out
            </Link>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Needs a reorder
            </h2>
            {data.lowStock.length === 0 ? (
              <EmptyState
                title="Nothing is at reorder"
                body="Low stock yahan dikhega jab qty reorder level pe ya usse kam ho."
              />
            ) : (
              <ul className="grid gap-2.5">
                {data.lowStock.map((product) => (
                  <li key={product.id}>
                    <Card className="shadow-none">
                      <CardHeader className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base font-medium">{product.name}</CardTitle>
                            <CardDescription className="text-xs font-light">
                              HSN {product.hsnCode} · {gstLabel(product.gstRate)} ·{" "}
                              {product.categoryName}
                            </CardDescription>
                          </div>
                          <Badge variant="destructive" className="font-normal">
                            {stockStatusLabel(product.stockStatus || "low")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 text-sm font-light">
                        On hand{" "}
                        <span className="font-normal tabular-nums">
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
    <Card className={emphasize ? "border-primary/20 bg-accent/50 shadow-none" : "shadow-none"}>
      <CardHeader className="py-4">
        <CardDescription className="text-xs font-light">{label}</CardDescription>
        <CardTitle className="font-heading text-2xl font-medium tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 text-xs font-light text-muted-foreground">{note}</CardContent>
    </Card>
  );
}
