"use client";

import { useState } from "react";
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
import { inr, qtyWithUnit, shopDate } from "@/lib/format";
import { gstLabel } from "@/lib/gst";
import { useBook } from "@/lib/use-book";

function purchaseRows(vouchers) {
  return vouchers.map((voucher) => ({
    id: voucher.id,
    date: voucher.date,
    party: voucher.supplierName,
    total: voucher.total,
    taxableTotal: voucher.taxableTotal,
    cgstTotal: voucher.cgstTotal,
    sgstTotal: voucher.sgstTotal,
    ewayBillNo: voucher.ewayBillNo,
    vehicleNo: voucher.vehicleNo,
    transporterName: voucher.transporterName,
    margin: null,
    lines: voucher.lines.map((line) => ({
      productName: line.productName,
      hsnCode: line.hsnCode,
      unit: line.unit,
      qty: line.qty,
      rate: line.cp,
      gstRate: line.gstRate,
      taxable: line.taxable,
      cgst: line.cgst,
      sgst: line.sgst,
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
    taxableTotal: voucher.taxableTotal,
    cgstTotal: voucher.cgstTotal,
    sgstTotal: voucher.sgstTotal,
    ewayBillNo: voucher.ewayBillNo,
    vehicleNo: voucher.vehicleNo,
    transporterName: voucher.transporterName,
    margin: voucher.margin,
    lines: voucher.lines.map((line) => ({
      productName: line.productName,
      hsnCode: line.hsnCode,
      unit: line.unit,
      qty: line.qty,
      rate: line.sp,
      gstRate: line.gstRate,
      taxable: line.taxable,
      cgst: line.cgst,
      sgst: line.sgst,
      lineTotal: line.lineTotal,
      margin: line.margin,
    })),
  }));
}

export function PurchaseRegister() {
  return <Register mode="purchase" />;
}

export function SalesRegister() {
  return <Register mode="sale" />;
}

function Register({ mode }) {
  const purchase = mode === "purchase";
  const book = useBook(purchase ? getPurchases : getSales);
  const rows = book.data ? (purchase ? purchaseRows(book.data) : saleRows(book.data)) : null;
  const { error, loading, reload } = book;
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    if (!pending) return;
    setBusy(true);
    setDeleteError(null);
    try {
      if (purchase) await deletePurchase(pending.id);
      else await deleteSale(pending.id);
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
            ? "Stock-in vouchers with HSN, GST split, and e-way bill when filled."
            : "Stock-out vouchers with HSN, GST, margin, and e-way bill when filled."
        }
      />
      {loading && !rows ? <LoadingState label="Loading register…" /> : null}
      {error && !rows ? <ErrorState message={error} onRetry={reload} /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState
          title={purchase ? "No purchases posted" : "No sales posted"}
          body={
            purchase
              ? "Stock in se pehla bill post karo — register yahan dikhega."
              : "Stock out se pehli sale post karo — register yahan dikhega."
          }
        />
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="grid gap-2.5">
          {rows.map((voucher) => (
            <li key={voucher.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-light text-muted-foreground">{shopDate(voucher.date)}</p>
                  <h2 className="text-base font-medium tracking-tight">{voucher.party}</h2>
                  {voucher.ewayBillNo ? (
                    <p className="mt-1 text-xs font-light text-muted-foreground">
                      E-way {voucher.ewayBillNo}
                      {voucher.vehicleNo ? ` · ${voucher.vehicleNo}` : ""}
                      {voucher.transporterName ? ` · ${voucher.transporterName}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium tabular-nums">{inr(voucher.total)}</p>
                  <p className="text-xs font-light text-muted-foreground">
                    Taxable {inr(voucher.taxableTotal)} · CGST {inr(voucher.cgstTotal)} · SGST{" "}
                    {inr(voucher.sgstTotal)}
                  </p>
                  <p className="text-xs font-light text-muted-foreground">
                    {voucher.margin == null ? "At cost" : `Margin ${inr(voucher.margin)}`}
                  </p>
                </div>
              </div>
              <ul className="mt-3 grid gap-1.5">
                {voucher.lines.map((line, index) => (
                  <li key={`${voucher.id}-${index}`} className="text-sm font-light">
                    <span className="font-normal">HSN {line.hsnCode}</span> · {line.productName} ·{" "}
                    {qtyWithUnit(line.qty, line.unit)} @ {inr(line.rate)}
                    <span className="text-muted-foreground">
                      {" "}
                      · {gstLabel(line.gstRate)} · {inr(line.lineTotal)}
                    </span>
                    {line.margin != null ? (
                      <span className="text-muted-foreground"> · margin {inr(line.margin)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="destructive"
                className="mt-3 h-9 px-3 text-sm font-normal"
                onClick={() => {
                  setDeleteError(null);
                  setPending(voucher);
                }}
              >
                Delete voucher
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
            <DialogTitle className="text-base font-medium">
              {purchase ? "Delete this purchase?" : "Delete this sale?"}
            </DialogTitle>
            <DialogDescription className="text-sm font-light">
              {purchase
                ? "Stock will reduce by the voucher qty if those bags are still on hand."
                : "Stock will be restored. Product SP stays as posted."}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="text-sm font-normal text-destructive">{deleteError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="h-10 text-sm" onClick={() => setPending(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 text-sm"
              disabled={busy}
              onClick={confirmDelete}
            >
              {busy ? "Deleting…" : "Delete voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
