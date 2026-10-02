"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStockButton } from "@/components/add-stock-modal";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { getCategories, getProducts } from "@/lib/api";
import { inr, qtyWithUnit } from "@/lib/format";
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          className="mb-0"
          title="Products on the book"
          lede="List se select karke stock add karo. Naya naam, category, ya bag/bottle size list me na ho to modal me hi turant add ho jata hai."
        />
        {ready ? (
          <AddStockButton
            categories={categoriesBook.data}
            products={productsBook.data}
            onDone={reloadAll}
            className="h-14 shrink-0 gap-2 text-lg"
          />
        ) : null}
      </div>

      {!ready && loading ? <LoadingState /> : null}
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
        body="Add stock button dabao. Category aur product list se choose karo, ya naya add karo."
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
    <div className="space-y-6">
      {[...groups.entries()].map(([category, rows]) => (
        <section key={category}>
          <h2 className="mb-3 text-xl font-semibold">{category}</h2>
          <ul className="grid gap-3">
            {rows.map((product) => (
              <li key={product.id}>
                <Card>
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <Badge
                        variant={stockStatusVariant(
                          product.stockStatus || (product.lowStock ? "low" : "in_stock"),
                        )}
                      >
                        {stockStatusLabel(
                          product.stockStatus || (product.lowStock ? "low" : "in_stock"),
                        )}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {qtyWithUnit(product.stockQty, product.unit)}
                    </p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3 text-base">
                    <figure>
                      <figcaption className="text-muted-foreground">CP</figcaption>
                      <p className="text-lg font-semibold tabular-nums">{inr(product.cp)}</p>
                    </figure>
                    <figure>
                      <figcaption className="text-muted-foreground">SP</figcaption>
                      <p className="text-lg font-semibold tabular-nums">{inr(product.sp)}</p>
                    </figure>
                    <figure>
                      <figcaption className="text-muted-foreground">Margin</figcaption>
                      <p className="text-lg font-semibold tabular-nums">
                        {inr(product.marginPerUnit)}
                        {product.marginPercent != null ? (
                          <span className="block text-sm font-medium text-muted-foreground">
                            {product.marginPercent}%
                          </span>
                        ) : null}
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
