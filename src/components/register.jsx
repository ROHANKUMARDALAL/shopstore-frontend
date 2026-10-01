"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { deletePurchase, deleteSale, getPurchases, getSales } from "@/lib/api";
import { inr, qty, shopDate } from "@/lib/format";
import { useBook } from "@/lib/use-book";

function purchaseRows(vouchers) {
  return vouchers.map((voucher) => ({
    id: voucher.id,
    date: voucher.date,
    party: voucher.supplierName,
    total: voucher.total,
    margin: null,
    lines: voucher.lines.map((line) => ({
      productName: line.productName,
      unit: line.unit,
      qty: line.qty,
      rate: line.cp,
      lineTotal: line.lineTotal,
      margin: null,
    })),
  }));
}

function saleRows(vouchers) {
  return vouchers.map((voucher) => ({
    id: voucher.id,
    date: voucher.date,
    party: voucher.customerShopName,
    total: voucher.total,
    margin: voucher.margin,
    lines: voucher.lines.map((line) => ({
      productName: line.productName,
      unit: line.unit,
      qty: line.qty,
      rate: line.sp,
      lineTotal: line.lineTotal,
      margin: line.margin,
    })),
  }));
}

export function Register({ kind }) {
  if (kind === "purchase") return <PurchaseRegister />;
  return <SaleRegister />;
}

function PurchaseRegister() {
  const book = useBook(getPurchases);
  return (
    <RegisterView
      kind="purchase"
      rows={book.data ? purchaseRows(book.data) : null}
      loading={book.loading}
      error={book.error}
      reload={book.reload}
      remove={deletePurchase}
    />
  );
}

function SaleRegister() {
  const book = useBook(getSales);
  return (
    <RegisterView
      kind="sale"
      rows={book.data ? saleRows(book.data) : null}
      loading={book.loading}
      error={book.error}
      reload={book.reload}
      remove={deleteSale}
    />
  );
}

function RegisterView({
  kind,
  rows,
  loading,
  error,
  reload,
  remove,
}

) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null);
  const purchase = kind === "purchase";

  async function confirmDelete() {
    if (!pending) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await remove(pending.id);
      setNotice(
        purchase
          ? "Purchase deleted. Stock was reduced by the quantity on that voucher."
          : "Sale deleted. Those bags are back in the godown.",
      );
      setPending(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete the voucher.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={purchase ? "Purchase register" : "Sales register"}
        lede={
          purchase
            ? "Stock-in vouchers. Deleting one takes the quantity back out, but only if those bags are still on hand."
            : "Stock-out vouchers. Deleting one puts the quantity back. Margin is the selling price minus the cost at the time of sale."
        }
      />
      {notice ? (
        <Alert className="mb-4">
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {loading && !rows ? <LoadingState /> : null}
      {error && !rows ? <ErrorState message={error} onRetry={reload} /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState
          title={purchase ? "No purchases posted" : "No sales posted"}
          body={
            purchase
              ? "Stock in is where a lorry from the supplier gets booked. The register stays empty until the first bill."
              : "Stock out is where a shop's bags leave the godown. Nothing has been sold on this book yet."
          }
        />
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((voucher) => (
            <li key={voucher.id} className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{shopDate(voucher.date)}</p>
                  <h2 className="text-2xl font-semibold">{voucher.party}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums">{inr(voucher.total)}</p>
                  <p className="text-base text-muted-foreground">
                    {voucher.margin == null ? "At cost" : `Margin ${inr(voucher.margin)}`}
                  </p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2">
                {voucher.lines.map((line, index) => (
                  <li key={`${voucher.id}-${index}`} className="text-lg">
                    {line.productName} · {qty(line.qty)} {line.unit} @ {inr(line.rate)}
                    <span className="text-muted-foreground"> · {inr(line.lineTotal)}</span>
                    {line.margin != null ? (
                      <span className="text-muted-foreground"> · margin {inr(line.margin)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="destructive"
                className="mt-4 h-12 px-4 text-base"
                onClick={() => {
                  setDeleteError(null);
                  setPending(voucher);
                }}
              >
                Delete this voucher
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {purchase ? "Delete this purchase?" : "Delete this sale?"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {purchase
                ? "Stock will be reduced by the quantity on the voucher. If those bags were already sold, the delete is refused and nothing changes."
                : "Stock will be put back for every line on this voucher. The selling price on the product stays as posted."}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="text-base font-medium text-destructive">{deleteError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="h-12" onClick={() => setPending(null)}>
              Keep it
            </Button>
            <Button type="button" variant="destructive" className="h-12" disabled={busy} onClick={confirmDelete}>
              {busy ? "Deleting…" : "Delete voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
