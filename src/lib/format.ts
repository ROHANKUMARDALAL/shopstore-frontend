export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function qty(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);
}

export function qtyWithUnit(count: number, unit: string) {
  return `${qty(count)} × ${unit}`;
}

export function todayInput() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shopDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
