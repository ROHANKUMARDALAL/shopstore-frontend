"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import {
  createCategory,
  createProduct,
  getCategories,
  getProducts,

} from "@/lib/api";
import { inr, qtyWithUnit } from "@/lib/format";
import { useBook } from "@/lib/use-book";

const units = ["45 kg bag", "50 kg bag", "25 kg bag", "1 kg", "1 litre", "500 g", "250 ml"];

const selectClass =
  "h-14 w-full rounded-lg border border-input bg-card px-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function ProductsPage() {
  const productsBook = useBook(getProducts);
  const categoriesBook = useBook(getCategories);
  const ready = productsBook.data && categoriesBook.data;
  const loading = productsBook.loading || categoriesBook.loading;
  const error = productsBook.error || categoriesBook.error;

  return (
    <div>
      <PageHeader
        title="Products on the book"
        lede="Cost price, selling price, bags on hand, and the margin on each bag."
      />
      {!ready && loading ? <LoadingState /> : null}
      {!ready && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            productsBook.reload();
            categoriesBook.reload();
          }}
        />
      ) : null}
      {ready && productsBook.data && categoriesBook.data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ProductList products={productsBook.data} />
          <AddProduct
            categories={categoriesBook.data}
            onCreated={() => {
              productsBook.reload();
              categoriesBook.reload();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products yet"
        body="Add urea, DAP, muriate of potash, or a crop-protection pack. The form is beside this note on a wide screen, and below it on a phone."
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
                      {product.lowStock ? <Badge variant="destructive">Low stock</Badge> : null}
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

function AddProduct({
  categories,
  onCreated,
}

) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [unit, setUnit] = useState("50 kg bag");
  const [cp, setCp] = useState("");
  const [sp, setSp] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [categoryName, setCategoryName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function addCategory() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const created = await createCategory(categoryName);
      setCategoryName("");
      setCategoryId(created.id);
      setMessage(`${created.name} is on the book.`);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the category.");
    } finally {
      setBusy(false);
    }
  }

  async function addProduct() {
    setError(null);
    setMessage(null);
    if (!categoryId) {
      setError("Add a category first. Nitrogen, phosphatic, potassic, NPK, or crop protection.");
      return;
    }
    if (!name.trim() || cp.trim() === "" || sp.trim() === "") {
      setError("Name, cost price, and selling price are required.");
      return;
    }
    if (!Number.isFinite(Number(cp)) || !Number.isFinite(Number(sp))) {
      setError("Cost price and selling price must be numbers.");
      return;
    }
    setBusy(true);
    try {
      const created = await createProduct({
        name,
        category: categoryId,
        unit,
        cp: Number(cp),
        sp: Number(sp),
        stockQty: Number(stockQty || 0),
        reorderLevel: Number(reorderLevel || 0),
      });
      setName("");
      setCp("");
      setSp("");
      setStockQty("0");
      setMessage(`${created.name} added. On hand: ${qtyWithUnit(created.stockQty, created.unit)}.`);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="h-fit lg:sticky lg:top-28">
      <CardHeader>
        <CardTitle className="text-xl">Add to the book</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message ? (
          <Alert>
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Not saved</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="new-category" className="text-base">
            New category
          </Label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Water soluble"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-14 px-4 text-base"
              disabled={busy || !categoryName.trim()}
              onClick={addCategory}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="product-name" className="text-base">
            Product
          </Label>
          <Input
            id="product-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Urea 46% N (Neem Coated)"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-category" className="text-base">
            Category
          </Label>
          <select
            id="product-category"
            className={selectClass}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.length === 0 ? <option value="">No categories yet</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-unit" className="text-base">
            Unit
          </Label>
          <Input
            id="product-unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="50 kg bag"
          />
          <div className="flex flex-wrap gap-2">
            {units.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={item === unit ? "default" : "outline"}
                className="h-10 px-3"
                onClick={() => setUnit(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="product-cp" className="text-base">
              Cost price
            </Label>
            <Input
              id="product-cp"
              inputMode="decimal"
              value={cp}
              onChange={(event) => setCp(event.target.value)}
              placeholder="1320"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-sp" className="text-base">
              Selling price
            </Label>
            <Input
              id="product-sp"
              inputMode="decimal"
              value={sp}
              onChange={(event) => setSp(event.target.value)}
              placeholder="1350"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="opening" className="text-base">
              Opening stock
            </Label>
            <Input
              id="opening"
              inputMode="decimal"
              value={stockQty}
              onChange={(event) => setStockQty(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reorder" className="text-base">
              Reorder at
            </Label>
            <Input
              id="reorder"
              inputMode="decimal"
              value={reorderLevel}
              onChange={(event) => setReorderLevel(event.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Opening stock is the count already on the floor. Later lorries go through Stock in.
        </p>
        <Button type="button" className="h-14 text-lg" disabled={busy} onClick={addProduct}>
          Save product
        </Button>
      </CardContent>
    </Card>
  );
}
