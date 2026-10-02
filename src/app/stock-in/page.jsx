"use client";

import { AddStockButton } from "@/components/add-stock-modal";
import { VoucherForm } from "@/components/voucher-form";
import { getCategories, getProducts } from "@/lib/api";
import { useBook } from "@/lib/use-book";
import { LoadingState } from "@/components/states";

export default function StockInPage() {
  const productsBook = useBook(getProducts);
  const categoriesBook = useBook(getCategories);
  const ready = productsBook.data && categoriesBook.data;
  const loading = (productsBook.loading || categoriesBook.loading) && !ready;

  return (
    <div className="space-y-5">
      {loading ? <LoadingState label="Loading stock in…" /> : null}
      {ready ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Quick add by HSN</p>
            <p className="text-xs font-light text-muted-foreground">
              List se product choose karo. Naya ho to HSN, GST, size yahi pe. E-way bill optional.
            </p>
          </div>
          <AddStockButton
            categories={categoriesBook.data}
            products={productsBook.data}
            onDone={() => {
              productsBook.reload();
              categoriesBook.reload();
            }}
          />
        </div>
      ) : null}
      <VoucherForm mode="in" />
    </div>
  );
}
