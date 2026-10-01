"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { createPurchase, createSale, getProducts } from "@/lib/api";
import { inr, qtyWithUnit, todayInput } from "@/lib/format";
import { useBook } from "@/lib/use-book";

const selectClass =
  "h-14 w-full rounded-lg border border-input bg-card px-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
        title={stockIn ? "Buy / Stock in" : "Sell / Stock out"}
        lede={
          stockIn
            ? "Step 3: supplier bill. Quantity goes up. The rate on this bill becomes the latest cost price."
            : "Step 4: shop bill. Quantity goes down. Margin shows before you post. The sale is blocked if you ask for more than is on hand."
        }
      />
      {loading && !products ? <LoadingState /> : null}
      {error && !products ? <ErrorState message={error} onRetry={reload} /> : null}
      {products && products.length === 0 ? (
        <EmptyState
          title="Add a product before you book a voucher"
          body="The counter needs urea, DAP, or a crop-protection pack on the book before stock can move."
        />
      ) : null}
      {products && products.length > 0 ? (
        <Form products={products} mode={mode} onPosted={reload} />
      ) : null}
    </div>
  );
}

function Form({
  products,
  mode,
  onPosted,
}

) {
  const stockIn = mode === "in";
  const [party, setParty] = useState("");
  const [date, setDate] = useState(todayInput);
  const [lines, setLines] = useState([blankLine(products[0], mode)]);
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
        blocked = `Only ${qtyWithUnit(product.stockQty, product.unit)} of ${product.name} are in stock. This sale asks for ${qtyWithUnit(asked, product.unit)}.`;
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
      setError("Each line needs a product, a quantity above zero, and a price.");
      return;
    }
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    try {
      if (stockIn) {
        const saved = await createPurchase({
          supplierName: party.trim(),
          date,
          lines: lines.map((line) => ({
            product: line.productId,
            qty: Number(line.qty),
            cp: Number(line.rate),
          })),
        });
        setNotice(
          `Posted. ${saved.supplierName} — ${inr(saved.total)} at cost. Stock has increased.`,
        );
      } else {
        const saved = await createSale({
          customerShopName: party.trim(),
          date,
          lines: lines.map((line) => ({
            product: line.productId,
            qty: Number(line.qty),
            sp: Number(line.rate),
          })),
        });
        setNotice(
          `Posted. ${saved.customerShopName} — ${inr(saved.total)}. Margin ${inr(saved.margin)}. Stock has decreased.`,
        );
      }
      setParty("");
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
    <div className="grid max-w-3xl gap-5">
      {notice ? (
        <Alert>
          <AlertTitle className="text-lg">Voucher posted</AlertTitle>
          <AlertDescription className="text-base">{notice}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle className="text-lg">Not posted</AlertTitle>
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="party" className="text-base">
            {stockIn ? "Supplier name" : "Customer shop name"}
          </Label>
          <Input
            id="party"
            value={party}
            onChange={(event) => setParty(event.target.value)}
            placeholder={stockIn ? "Krishak Co-op Depot" : "Sharma Krishi Bhandar"}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date" className="text-base">
            Date
          </Label>
          <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>

      <div className="grid gap-4">
        {lines.map((line, index) => {
          const product = byId.get(line.productId);
          const amount = Number(line.qty);
          const rate = Number(line.rate);
          const lineMargin =
            product && amount > 0 && Number.isFinite(rate) ? amount * (rate - product.cp) : null;
          return (
            <fieldset key={line.key} className="grid gap-3 rounded-xl border border-border bg-card p-4">
              <legend className="px-1 text-base font-semibold">Line {index + 1}</legend>
              <div className="grid gap-2">
                <Label className="text-base" htmlFor={`product-${line.key}`}>
                  Product
                </Label>
                <select
                  id={`product-${line.key}`}
                  className={selectClass}
                  value={line.productId}
                  onChange={(event) => chooseProduct(line.key, event.target.value)}
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {qtyWithUnit(item.stockQty, item.unit)}
                    </option>
                  ))}
                </select>
                {product ? (
                  <p className="text-base text-muted-foreground">
                    On hand {qtyWithUnit(product.stockQty, product.unit)}. CP {inr(product.cp)}. SP{" "}
                    {inr(product.sp)}.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor={`qty-${line.key}`}>
                    Quantity
                  </Label>
                  <Input
                    id={`qty-${line.key}`}
                    inputMode="decimal"
                    value={line.qty}
                    onChange={(event) => updateLine(line.key, { qty: event.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor={`rate-${line.key}`}>
                    {stockIn ? "Cost price (CP)" : "Selling price (SP)"}
                  </Label>
                  <Input
                    id={`rate-${line.key}`}
                    inputMode="decimal"
                    value={line.rate}
                    onChange={(event) => updateLine(line.key, { rate: event.target.value })}
                    placeholder={stockIn ? "250" : "270"}
                  />
                </div>
              </div>
              {!stockIn && lineMargin != null ? (
                <p className="text-lg font-semibold">
                  Margin on this line {inr(lineMargin)}
                  {product ? (
                    <span className="ml-2 text-base font-medium text-muted-foreground">
                      {inr(rate - product.cp)} per {product.unit}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 justify-start px-2 text-base"
                  onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                >
                  Remove line
                </Button>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {blocked ? <p className="text-lg font-semibold text-destructive">{blocked}</p> : null}
      {!stockIn ? (
        <p className="text-xl font-semibold">Margin on this voucher {inr(previewMargin)}</p>
      ) : (
        <p className="text-base text-muted-foreground">
          Posting increases stock and saves the last line&apos;s CP as the product cost.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-14 text-lg"
          onClick={() => setLines((current) => [...current, blankLine(products[0], mode)])}
        >
          Add another line
        </Button>
        <Button type="button" className="h-14 flex-1 text-lg" disabled={busy || Boolean(blocked)} onClick={submit}>
          {busy ? "Posting…" : stockIn ? "Post stock in" : "Post stock out"}
        </Button>
      </div>
    </div>
  );
}
