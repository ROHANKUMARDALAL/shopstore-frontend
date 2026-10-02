"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { createPurchase, createSale, getProducts } from "@/lib/api";
import { inr, qtyWithUnit, todayInput } from "@/lib/format";
import { gstLabel } from "@/lib/gst";
import { useBook } from "@/lib/use-book";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function blankLine(product, mode = "in") {
  return {
    key: Math.random().toString(36).slice(2),
    productId: product?.id ?? "",
    qty: "",
    rate: product ? String(mode === "in" ? product.cp : product.sp) : "",
  };
}

export function VoucherForm({ mode }) {
  const { data: products, error, loading, reload } = useBook(getProducts);
  const stockIn = mode === "in";

  return (
    <div>
      <PageHeader
        title={stockIn ? "Stock in" : "Stock out"}
        lede={
          stockIn
            ? "Supplier bill by HSN. Quantity up, CP updates, GST and e-way bill optional."
            : "Shop bill by HSN. Quantity down, margin before post, GST + e-way bill supported."
        }
      />
      {loading && !products ? <LoadingState label="Loading products…" /> : null}
      {error && !products ? <ErrorState message={error} onRetry={reload} /> : null}
      {products && products.length === 0 ? (
        <EmptyState
          title="Add a product first"
          body="Products page se HSN ke saath product save karo, phir yahan stock move hoga."
        />
      ) : null}
      {products && products.length > 0 ? (
        <Form products={products} mode={mode} onPosted={reload} />
      ) : null}
    </div>
  );
}

function Form({ products, mode, onPosted }) {
  const stockIn = mode === "in";
  const [party, setParty] = useState("");
  const [date, setDate] = useState(todayInput);
  const [lines, setLines] = useState([blankLine(products[0], mode)]);
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  function updateLine(key, patch) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function chooseProduct(key, productId) {
    const product = byId.get(productId);
    updateLine(key, {
      productId,
      rate: product ? String(stockIn ? product.cp : product.sp) : "",
    });
  }

  const demand = new Map();
  for (const line of lines) {
    const amount = Number(line.qty);
    if (!line.productId || !Number.isFinite(amount) || amount <= 0) continue;
    demand.set(line.productId, (demand.get(line.productId) || 0) + amount);
  }

  let blocked = "";
  if (!stockIn) {
    for (const [productId, asked] of demand) {
      const product = byId.get(productId);
      if (product && asked > product.stockQty) {
        blocked = `Only ${qtyWithUnit(product.stockQty, product.unit)} of ${product.name} (HSN ${product.hsnCode}) are in stock. This sale asks for ${qtyWithUnit(asked, product.unit)}.`;
      }
    }
  }

  async function submit() {
    setNotice(null);
    setError(null);
    if (!party.trim()) {
      setError(stockIn ? "Supplier name is required." : "Customer shop name is required.");
      return;
    }
    if (
      lines.some((line) => {
        const amount = Number(line.qty);
        const rate = Number(line.rate);
        return !line.productId || !(amount > 0) || line.rate.trim() === "" || !Number.isFinite(rate) || rate < 0;
      })
    ) {
      setError("Each line needs a product, quantity, and price.");
      return;
    }
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    try {
      const eway = { ewayBillNo, vehicleNo, transporterName };
      if (stockIn) {
        const saved = await createPurchase({
          supplierName: party.trim(),
          date,
          ...eway,
          lines: lines.map((line) => ({
            product: line.productId,
            qty: Number(line.qty),
            cp: Number(line.rate),
          })),
        });
        setNotice(
          `Posted. ${saved.supplierName} — taxable ${inr(saved.taxableTotal)}, total ${inr(saved.total)} incl. GST.`,
        );
      } else {
        const saved = await createSale({
          customerShopName: party.trim(),
          date,
          ...eway,
          lines: lines.map((line) => ({
            product: line.productId,
            qty: Number(line.qty),
            sp: Number(line.rate),
          })),
        });
        setNotice(
          `Posted. ${saved.customerShopName} — total ${inr(saved.total)} incl. GST. Margin ${inr(saved.margin)}.`,
        );
      }
      setParty("");
      setEwayBillNo("");
      setVehicleNo("");
      setTransporterName("");
      setLines([blankLine(products[0], mode)]);
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The voucher was not posted.");
    } finally {
      setBusy(false);
    }
  }

  const previewMargin = lines.reduce((sum, line) => {
    const product = byId.get(line.productId);
    const amount = Number(line.qty);
    const rate = Number(line.rate);
    if (!product || !(amount > 0) || !Number.isFinite(rate)) return sum;
    return sum + amount * (rate - product.cp);
  }, 0);

  return (
    <div className="grid max-w-3xl gap-4">
      {notice ? (
        <Alert>
          <AlertTitle className="text-sm font-medium">Voucher posted</AlertTitle>
          <AlertDescription className="text-sm font-light">{notice}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle className="text-sm font-medium">Not posted</AlertTitle>
          <AlertDescription className="text-sm font-light">{error}</AlertDescription>
        </Alert>
      ) : null}
      {blocked ? (
        <Alert variant="destructive">
          <AlertTitle className="text-sm font-medium">Not enough stock</AlertTitle>
          <AlertDescription className="text-sm font-light">{blocked}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="party" className="text-sm font-normal">
            {stockIn ? "Supplier name" : "Customer shop"}
          </Label>
          <Input
            id="party"
            className="h-11 text-sm"
            value={party}
            onChange={(event) => setParty(event.target.value)}
            placeholder={stockIn ? "Krishak Co-op Depot" : "Sharma Krishi Bhandar"}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date" className="text-sm font-normal">
            Date
          </Label>
          <Input
            id="date"
            className="h-11 text-sm"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border bg-card p-3.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          E-way bill (optional)
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            className="h-10 text-sm"
            value={ewayBillNo}
            onChange={(event) => setEwayBillNo(event.target.value)}
            placeholder="E-way bill no."
          />
          <Input
            className="h-10 text-sm"
            value={vehicleNo}
            onChange={(event) => setVehicleNo(event.target.value)}
            placeholder="Vehicle no."
          />
          <Input
            className="h-10 text-sm"
            value={transporterName}
            onChange={(event) => setTransporterName(event.target.value)}
            placeholder="Transporter"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {lines.map((line, index) => {
          const product = byId.get(line.productId);
          const amount = Number(line.qty);
          const rate = Number(line.rate);
          const lineMargin =
            product && amount > 0 && Number.isFinite(rate) ? amount * (rate - product.cp) : null;
          return (
            <fieldset key={line.key} className="grid gap-3 rounded-xl border bg-card p-3.5">
              <legend className="px-1 text-sm font-medium">Line {index + 1}</legend>
              <div className="grid gap-1.5">
                <Label className="text-sm font-normal" htmlFor={`product-${line.key}`}>
                  Product (HSN)
                </Label>
                <select
                  id={`product-${line.key}`}
                  className={selectClass}
                  value={line.productId}
                  onChange={(event) => chooseProduct(line.key, event.target.value)}
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.hsnCode} · {item.name} — {qtyWithUnit(item.stockQty, item.unit)}
                    </option>
                  ))}
                </select>
                {product ? (
                  <p className="text-xs font-light text-muted-foreground">
                    On hand {qtyWithUnit(product.stockQty, product.unit)}. {gstLabel(product.gstRate)}.
                    CP {inr(product.cp)}. SP {inr(product.sp)}.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-sm font-normal" htmlFor={`qty-${line.key}`}>
                    Quantity
                  </Label>
                  <Input
                    id={`qty-${line.key}`}
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={line.qty}
                    onChange={(event) => updateLine(line.key, { qty: event.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm font-normal" htmlFor={`rate-${line.key}`}>
                    {stockIn ? "Cost price (CP)" : "Selling price (SP)"}
                  </Label>
                  <Input
                    id={`rate-${line.key}`}
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={line.rate}
                    onChange={(event) => updateLine(line.key, { rate: event.target.value })}
                  />
                </div>
              </div>
              {!stockIn && lineMargin != null ? (
                <p className="text-sm font-normal">
                  Margin on this line {inr(lineMargin)}
                  {product ? (
                    <span className="ml-2 text-xs font-light text-muted-foreground">
                      {inr(rate - product.cp)} per {product.unit}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-fit text-sm font-normal"
                  onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}
                >
                  Remove line
                </Button>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {!stockIn ? (
        <p className="text-sm font-light text-muted-foreground">
          Preview margin {inr(previewMargin)} (before GST).
        </p>
      ) : (
        <p className="text-sm font-light text-muted-foreground">
          Posting increases stock and sets latest CP. GST adds on taxable amount.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 text-sm font-normal"
          onClick={() => setLines((current) => [...current, blankLine(products[0], mode)])}
        >
          Add another line
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 text-sm font-normal"
          disabled={busy || Boolean(blocked)}
          onClick={submit}
        >
          {busy ? "Posting…" : stockIn ? "Post stock in" : "Post stock out"}
        </Button>
      </div>
    </div>
  );
}
