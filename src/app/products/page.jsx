"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStockButton } from "@/components/add-stock-modal";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { getCategories, getProducts } from "@/lib/api";
import { inr, qtyWithUnit } from "@/lib/format";
import { gstLabel } from "@/lib/gst";
import { stockStatusLabel, stockStatusVariant } from "@/lib/stock-status";
import { useBook } from "@/lib/use-book";

export default function ProductsPage() {
  const productsBook = useBook(getProducts);
  const categoriesBook = useBook(getCategories);
  const ready = productsBook.data && categoriesBook.data;
  const loading = productsBook.loading || categoriesBook.loading;
  const error = productsBook.error || categoriesBook.error;

  function reloadAll() {
    productsBook.reload();
    categoriesBook.reload();
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          className="mb-0"
          title="Products"
          lede="Har product ka unique HSN code. Stock in/out, margin, aur GST usi HSN ke hisaab se chalte hain."
        />
        {ready ? (
          <AddStockButton
            categories={categoriesBook.data}
            products={productsBook.data}
            onDone={reloadAll}
            className="h-11 shrink-0 gap-2 text-sm font-normal"
          />
        ) : null}
      </div>

      {!ready && loading ? <LoadingState label="Loading products…" /> : null}
      {!ready && error ? <ErrorState message={error} onRetry={reloadAll} /> : null}
      {ready && productsBook.data ? <ProductList products={productsBook.data} /> : null}
    </div>
  );
}

function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products yet"
        body="Add stock se list choose karo, ya naya product HSN aur GST ke saath save karo."
      />
    );
  }

  const groups = new Map();
  for (const product of products) {
    const key = product.categoryName || "Uncategorised";
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([category, rows]) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {category}
          </h2>
          <ul className="grid gap-2.5">
            {rows.map((product) => (
              <li key={product.id}>
                <Card className="shadow-none">
                  <CardHeader className="gap-1.5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-medium tracking-tight">
                          {product.name}
                        </CardTitle>
                        <p className="mt-1 text-xs font-light text-muted-foreground">
                          HSN {product.hsnCode} · {gstLabel(product.gstRate)}
                        </p>
                      </div>
                      <Badge
                        variant={stockStatusVariant(
                          product.stockStatus || (product.lowStock ? "low" : "in_stock"),
                        )}
                        className="font-normal"
                      >
                        {stockStatusLabel(
                          product.stockStatus || (product.lowStock ? "low" : "in_stock"),
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm font-normal tabular-nums">
                      {qtyWithUnit(product.stockQty, product.unit)}
                    </p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 pb-4 text-sm sm:grid-cols-4">
                    <figure>
                      <figcaption className="text-xs text-muted-foreground">CP</figcaption>
                      <p className="font-normal tabular-nums">{inr(product.cp)}</p>
                    </figure>
                    <figure>
                      <figcaption className="text-xs text-muted-foreground">SP</figcaption>
                      <p className="font-normal tabular-nums">{inr(product.sp)}</p>
                    </figure>
                    <figure>
                      <figcaption className="text-xs text-muted-foreground">Margin</figcaption>
                      <p className="font-normal tabular-nums">
                        {inr(product.marginPerUnit)}
                        {product.marginPercent != null ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {product.marginPercent}%
                          </span>
                        ) : null}
                      </p>
                    </figure>
                    <figure>
                      <figcaption className="text-xs text-muted-foreground">GST</figcaption>
                      <p className="font-normal tabular-nums">
                        {product.cgstRate}% + {product.sgstRate}%
                      </p>
                    </figure>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
