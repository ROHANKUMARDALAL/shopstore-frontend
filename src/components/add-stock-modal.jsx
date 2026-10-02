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
import { GST_RATE_OPTIONS, gstLabel } from "@/lib/gst";

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
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AddStockButton({ categories, products, onDone, className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="lg"
        className={className || "h-11 gap-2 text-sm font-normal"}
        onClick={() => setOpen(true)}
      >
        <PackagePlus className="size-4" />
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
  const [hsnCode, setHsnCode] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [unit, setUnit] = useState("50 kg bag");
  const [customUnit, setCustomUnit] = useState("");
  const [cp, setCp] = useState("");
  const [sp, setSp] = useState("");
  const [qty, setQty] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporterName, setTransporterName] = useState("");
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
    setHsnCode("");
    setGstRate("18");
    setUnit("50 kg bag");
    setCustomUnit("");
    setCp("");
    setSp("");
    setQty("");
    setSupplierName("");
    setReorderLevel("10");
    setEwayBillNo("");
    setVehicleNo("");
    setTransporterName("");
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
        if (!newCategoryName.trim()) throw new Error("New category name is required.");
        const createdCategory = await createCategory(newCategoryName.trim());
        activeCategoryId = createdCategory.id;
      }

      if (!activeCategoryId) {
        throw new Error("Choose a category from the list, or add a new one.");
      }

      if (addingNewProduct) {
        const pack = resolvedUnit();
        if (!newProductName.trim()) throw new Error("Enter the new product name.");
        if (!hsnCode.trim()) throw new Error("Enter the unique HSN code.");
        if (!pack) throw new Error("Choose a pack / bottle / bag size.");
        if (!Number.isFinite(Number(cp)) || !Number.isFinite(Number(sp))) {
          throw new Error("Cost price and selling price must be numbers.");
        }
        const opening = Number(qty || 0);
        if (opening < 0) throw new Error("Opening stock cannot be negative.");

        const created = await createProduct({
          name: newProductName.trim(),
          category: activeCategoryId,
          hsnCode: hsnCode.trim(),
          gstRate: Number(gstRate),
          unit: pack,
          cp: Number(cp),
          sp: Number(sp),
          stockQty: opening,
          reorderLevel: Number(reorderLevel || 0),
        });

        setMessage(
          `${created.name} (HSN ${created.hsnCode}) saved. On hand ${qtyWithUnit(created.stockQty, created.unit)}.`,
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
      if (!supplierName.trim()) throw new Error("Enter the supplier name.");

      const purchase = await createPurchase({
        supplierName: supplierName.trim(),
        date: todayInput(),
        ewayBillNo,
        vehicleNo,
        transporterName,
        lines: [{ product: selectedProduct.id, qty: amount, cp: rate }],
      });

      setMessage(
        `Stock in for HSN ${selectedProduct.hsnCode}. ${purchase.supplierName} — ${inr(purchase.total)} incl. GST.`,
      );
      onDone?.();
      setQty("");
      setSupplierName("");
      setEwayBillNo("");
      setVehicleNo("");
      setTransporterName("");
      setCp(String(selectedProduct.cp));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add stock.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    Boolean(categoryId) && (addingNewProduct || Boolean(selectedProduct)) && !busy;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl gap-4 p-5">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Add stock</DialogTitle>
          <DialogDescription className="text-sm font-light">
            List se select karo. Naya ho to HSN, GST, aur pack size yahi pe add ho jayega. E-way bill
            optional hai.
          </DialogDescription>
        </DialogHeader>

        {message ? (
          <Alert>
            <AlertTitle className="text-sm font-medium">Done</AlertTitle>
            <AlertDescription className="text-sm font-light">{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle className="text-sm font-medium">Not saved</AlertTitle>
            <AlertDescription className="text-sm font-light">{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3.5">
          <div className="grid gap-1.5">
            <Label htmlFor="stock-category" className="text-sm font-normal">
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
                className="h-11 text-sm"
              />
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="stock-product" className="text-sm font-normal">
              2 · Product (by HSN / name)
            </Label>
            {addingNewCategory ? (
              <p className="rounded-lg border border-dashed px-3 py-2.5 text-sm font-light text-muted-foreground">
                New category ke saath naya product + HSN add hoga.
              </p>
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
                    setHsnCode(product.hsnCode);
                    setGstRate(String(product.gstRate));
                    setQty("");
                  } else {
                    setCp("");
                    setSp("");
                    setHsnCode("");
                    setGstRate("18");
                    setQty("0");
                  }
                }}
              >
                <option value="">
                  {categoryId
                    ? productsInCategory.length
                      ? "Select product from list…"
                      : "No product here — add new"
                    : "Choose category first"}
                </option>
                {productsInCategory.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.hsnCode} · {product.name} — {qtyWithUnit(product.stockQty, product.unit)}
                  </option>
                ))}
                <option value={NEW}>+ Add new product (not in list)</option>
              </select>
            )}
          </div>

          {addingNewProduct ? (
            <div className="grid gap-3 rounded-xl border border-dashed border-primary/25 bg-accent/40 p-3.5">
              <p className="text-sm font-medium text-primary">New product</p>
              <div className="grid gap-1.5">
                <Label htmlFor="new-product-name" className="text-sm font-normal">
                  Product name
                </Label>
                <Input
                  id="new-product-name"
                  className="h-11 text-sm"
                  value={newProductName}
                  onChange={(event) => setNewProductName(event.target.value)}
                  placeholder="Zinc Sulphate Hepta 21%"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="hsn" className="text-sm font-normal">
                    HSN code
                  </Label>
                  <Input
                    id="hsn"
                    className="h-11 text-sm"
                    value={hsnCode}
                    onChange={(event) => setHsnCode(event.target.value)}
                    placeholder="31021000"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gst" className="text-sm font-normal">
                    GST rate
                  </Label>
                  <select
                    id="gst"
                    className={selectClass}
                    value={gstRate}
                    onChange={(event) => setGstRate(event.target.value)}
                  >
                    {GST_RATE_OPTIONS.map((rate) => (
                      <option key={rate} value={rate}>
                        {gstLabel(rate)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pack-size" className="text-sm font-normal">
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
                    className="h-11 text-sm"
                    value={customUnit}
                    onChange={(event) => setCustomUnit(event.target.value)}
                    placeholder="Example: 10 kg bag"
                  />
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="new-cp" className="text-sm font-normal">
                    CP
                  </Label>
                  <Input
                    id="new-cp"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={cp}
                    onChange={(event) => setCp(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="new-sp" className="text-sm font-normal">
                    SP
                  </Label>
                  <Input
                    id="new-sp"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={sp}
                    onChange={(event) => setSp(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="opening-qty" className="text-sm font-normal">
                    Opening stock
                  </Label>
                  <Input
                    id="opening-qty"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="reorder-level" className="text-sm font-normal">
                    Reorder at
                  </Label>
                  <Input
                    id="reorder-level"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={reorderLevel}
                    onChange={(event) => setReorderLevel(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {selectedProduct ? (
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-3.5">
              <div>
                <p className="text-sm font-medium">{selectedProduct.name}</p>
                <p className="text-xs font-light text-muted-foreground">
                  HSN {selectedProduct.hsnCode} · {gstLabel(selectedProduct.gstRate)} · On hand{" "}
                  {qtyWithUnit(selectedProduct.stockQty, selectedProduct.unit)}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="supplier" className="text-sm font-normal">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  className="h-11 text-sm"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Krishak Co-op Depot"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="buy-qty" className="text-sm font-normal">
                    Qty in
                  </Label>
                  <Input
                    id="buy-qty"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="buy-cp" className="text-sm font-normal">
                    Bill CP
                  </Label>
                  <Input
                    id="buy-cp"
                    className="h-11 text-sm"
                    inputMode="decimal"
                    value={cp}
                    onChange={(event) => setCp(event.target.value)}
                  />
                </div>
              </div>
              <EwayFields
                ewayBillNo={ewayBillNo}
                setEwayBillNo={setEwayBillNo}
                vehicleNo={vehicleNo}
                setVehicleNo={setVehicleNo}
                transporterName={transporterName}
                setTransporterName={setTransporterName}
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-sm font-normal"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="h-10 gap-2 text-sm font-normal"
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              <Plus className="size-4" />
              {busy ? "Saving…" : addingNewProduct ? "Save new product" : "Post stock in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EwayFields({
  ewayBillNo,
  setEwayBillNo,
  vehicleNo,
  setVehicleNo,
  transporterName,
  setTransporterName,
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/80 bg-card p-3">
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
  );
}
