export const GST_RATE_OPTIONS = [0, 5, 12, 18, 28] as const;

export function gstLabel(gstRate: number) {
  const half = gstRate / 2;
  if (gstRate <= 0) return "GST 0%";
  return `GST ${gstRate}% (CGST ${half}% + SGST ${half}%)`;
}
