"use client";

import { AddStockButton } from "@/components/add-stock-modal";
import { VoucherForm } from "@/components/voucher-form";
import { getCategories, getProducts } from "@/lib/api";
import { useBook } from "@/lib/use-book";

export default function StockInPage() {
  const productsBook = useBook(getProducts);
  const categoriesBook = useBook(getCategories);
  const ready = productsBook.data && categoriesBook.data;

  return (
    <div className="space-y-6">
      {ready ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">Jaldi stock add</p>
            <p className="text-base text-muted-foreground">
              List se product choose karo. Naya ho to category, naam, size yahi pe add ho jayega.
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
