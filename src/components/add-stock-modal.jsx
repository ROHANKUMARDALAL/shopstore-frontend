"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, createProduct, createPurchase } from "@/lib/api";
import { inr, qtyWithUnit, todayInput } from "@/lib/format";

const NEW = "__new__";

const DEFAULT_PACK_SIZES = [
  "45 kg bag",
  "50 kg bag",
  "25 kg bag",
  "1 kg",
  "1 litre",
  "500 g",
  "250 ml",
  "100 ml",
  "5 litre",
];

const selectClass =
  "h-14 w-full rounded-xl border border-input bg-card px-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AddStockButton({ categories, products, onDone, className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="lg"
        className={className || "h-14 gap-2 text-lg"}
        onClick={() => setOpen(true)}
      >
        <PackagePlus className="size-5" />
        Add stock
      </Button>
      <AddStockModal
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        products={products}
        onDone={onDone}
      />
    </>
  );
}

export function AddStockModal({ open, onOpenChange, categories, products, onDone }) {
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [unit, setUnit] = useState("50 kg bag");
  const [customUnit, setCustomUnit] = useState("");
  const [cp, setCp] = useState("");
  const [sp, setSp] = useState("");
  const [qty, setQty] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const packSizes = useMemo(() => {
    const fromBook = products.map((row) => row.unit).filter(Boolean);
    return [...new Set([...DEFAULT_PACK_SIZES, ...fromBook])];
  }, [products]);

  const productsInCategory = useMemo(() => {
    if (!categoryId || categoryId === NEW) return [];
    return products
      .filter((row) => row.categoryId === categoryId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, categoryId]);

  const selectedProduct =
    productId && productId !== NEW ? products.find((row) => row.id === productId) : null;
  const addingNewCategory = categoryId === NEW;
  const addingNewProduct = addingNewCategory || productId === NEW;

  function resetForm() {
    setCategoryId("");
    setProductId("");
    setNewCategoryName("");
    setNewProductName("");
    setUnit("50 kg bag");
    setCustomUnit("");
    setCp("");
    setSp("");
    setQty("");
    setSupplierName("");
    setReorderLevel("10");
    setError(null);
  }

  function handleOpenChange(next) {
    onOpenChange(next);
    if (next) {
      resetForm();
      setMessage(null);
    }
  }

  function resolvedUnit() {
    if (unit === NEW) return customUnit.trim();
    return unit;
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      let activeCategoryId = categoryId;

      if (addingNewCategory) {
        if (!newCategoryName.trim()) {
          throw new Error("New category name is required.");
        }
        const createdCategory = await createCategory(newCategoryName.trim());
        activeCategoryId = createdCategory.id;
      }

      if (!activeCategoryId) {
        throw new Error("Choose a category from the list, or add a new one.");
      }

      if (addingNewProduct) {
        const pack = resolvedUnit();
        if (!newProductName.trim()) throw new Error("Enter the new product name.");
        if (!pack) throw new Error("Choose a pack / bottle / bag size.");
        if (!Number.isFinite(Number(cp)) || !Number.isFinite(Number(sp))) {
          throw new Error("Cost price and selling price must be numbers.");
        }
        const opening = Number(qty || 0);
        if (opening < 0) throw new Error("Opening stock cannot be negative.");

        const created = await createProduct({
          name: newProductName.trim(),
          category: activeCategoryId,
          unit: pack,
          cp: Number(cp),
          sp: Number(sp),
          stockQty: opening,
          reorderLevel: Number(reorderLevel || 0),
        });

        setMessage(
          `${created.name} saved on the book. On hand ${qtyWithUnit(created.stockQty, created.unit)}.`,
        );
        onDone?.();
        resetForm();
        return;
      }

      if (!selectedProduct) {
        throw new Error("Choose a product from the list, or add a new product.");
      }

      const amount = Number(qty);
      const rate = Number(cp || selectedProduct.cp);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter how many bags / bottles came in.");
      }
      if (!Number.isFinite(rate) || rate < 0) {
        throw new Error("Enter the cost price from the supplier bill.");
      }
      if (!supplierName.trim()) {
        throw new Error("Enter the supplier name.");
      }

      const purchase = await createPurchase({
        supplierName: supplierName.trim(),
        date: todayInput(),
        lines: [{ product: selectedProduct.id, qty: amount, cp: rate }],
      });

      setMessage(
        `Stock in posted for ${selectedProduct.name}. ${purchase.supplierName} — ${inr(purchase.total)} at cost.`,
      );
      onDone?.();
      setQty("");
      setSupplierName("");
      setCp(String(selectedProduct.cp));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add stock.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    Boolean(categoryId) &&
    (addingNewProduct || Boolean(selectedProduct)) &&
    !busy;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl gap-5 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Add stock</DialogTitle>
          <DialogDescription className="text-base">
            List se category aur product select karo. Jo list me na mile, wahi pe naya category,
            naam, ya bag/bottle size add kar sakte ho.
          </DialogDescription>
        </DialogHeader>

        {message ? (
          <Alert>
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Not saved</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="stock-category" className="text-base">
              1 · Category
            </Label>
            <select
              id="stock-category"
              className={selectClass}
              value={categoryId}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryId(value);
                setProductId(value === NEW ? NEW : "");
                setCp("");
                setSp("");
                setQty("");
              }}
            >
              <option value="">Select category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={NEW}>+ Add new category</option>
            </select>
            {addingNewCategory ? (
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Example: Water soluble"
                className="mt-1"
              />
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stock-product" className="text-base">
              2 · Product name
            </Label>
            {addingNewCategory ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-base text-muted-foreground">
                New category ke saath naya product hi add hoga — neeche naam bharein.
              </div>
            ) : (
              <select
                id="stock-product"
                className={selectClass}
                value={productId}
                disabled={!categoryId}
                onChange={(event) => {
                  const value = event.target.value;
                  setProductId(value);
                  const product = products.find((row) => row.id === value);
                  if (product) {
                    setCp(String(product.cp));
                    setSp(String(product.sp));
                    setUnit(product.unit);
                    setQty("");
                  } else {
                    setCp("");
                    setSp("");
                    setQty("0");
                  }
                }}
              >
                <option value="">
                  {categoryId
                    ? productsInCategory.length
                      ? "Select product from list…"
                      : "No product here — add new below"
                    : "Choose category first"}
                </option>
                {productsInCategory.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {qtyWithUnit(product.stockQty, product.unit)}
                  </option>
                ))}
                <option value={NEW}>+ Add new product (not in list)</option>
              </select>
            )}
          </div>

          {addingNewProduct ? (
            <div className="grid gap-4 rounded-2xl border border-dashed border-primary/30 bg-accent/40 p-4">
              <p className="text-base font-semibold text-primary">New product details</p>
              <div className="grid gap-2">
                <Label htmlFor="new-product-name" className="text-base">
                  Product name
                </Label>
                <Input
                  id="new-product-name"
                  value={newProductName}
                  onChange={(event) => setNewProductName(event.target.value)}
                  placeholder="Zinc Sulphate Hepta 21%"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pack-size" className="text-base">
                  Pack / bottle / bag size
                </Label>
                <select
                  id="pack-size"
                  className={selectClass}
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                >
                  {packSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                  <option value={NEW}>+ Add new size</option>
                </select>
                {unit === NEW ? (
                  <Input
                    value={customUnit}
                    onChange={(event) => setCustomUnit(event.target.value)}
                    placeholder="Example: 10 kg bag / 2 litre"
                  />
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="new-cp">Cost price (CP)</Label>
                  <Input
                    id="new-cp"
                    inputMode="decimal"
                    value={cp}
                    onChange={(event) => setCp(event.target.value)}
                    placeholder="980"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-sp">Selling price (SP)</Label>
                  <Input
                    id="new-sp"
                    inputMode="decimal"
                    value={sp}
                    onChange={(event) => setSp(event.target.value)}
                    placeholder="1120"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="opening-qty">Opening stock</Label>
                  <Input
                    id="opening-qty"
                    inputMode="decimal"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reorder-level">Reorder at</Label>
                  <Input
                    id="reorder-level"
                    inputMode="decimal"
                    value={reorderLevel}
                    onChange={(event) => setReorderLevel(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Opening stock floor pe jo pehle se hai. Baad ke lorries list se select karke stock in
                karo.
              </p>
            </div>
          ) : null}

          {selectedProduct ? (
            <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4">
              <div>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
                <p className="text-base text-muted-foreground">
                  On hand {qtyWithUnit(selectedProduct.stockQty, selectedProduct.unit)}. CP{" "}
                  {inr(selectedProduct.cp)}. SP {inr(selectedProduct.sp)}.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier name</Label>
                <Input
                  id="supplier"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Krishak Co-op Depot"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="buy-qty">Quantity coming in</Label>
                  <Input
                    id="buy-qty"
                    inputMode="decimal"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="buy-cp">Bill rate (CP)</Label>
                  <Input
                    id="buy-cp"
                    inputMode="decimal"
                    value={cp}
                    onChange={(event) => setCp(event.target.value)}
                    placeholder={String(selectedProduct.cp)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Listed product pe stock in — quantity badhegi aur ye rate latest CP ban jayega.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="h-12 gap-2 text-base"
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              <Plus className="size-4" />
              {busy
                ? "Saving…"
                : addingNewProduct
                  ? "Save new product"
                  : "Post stock in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
