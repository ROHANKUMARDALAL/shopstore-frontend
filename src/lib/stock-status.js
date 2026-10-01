export function stockStatusLabel(status) {
  if (status === "out_of_stock") return "Out of stock";
  if (status === "low") return "Low quantity";
  return "In stock";
}

export function stockStatusVariant(status) {
  if (status === "out_of_stock") return "destructive";
  if (status === "low") return "secondary";
  return "outline";
}
