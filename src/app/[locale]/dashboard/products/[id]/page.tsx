"use client";

import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/dashboard/products/product-detail";

/** The seller's view of one product: content, status, views, listing quality and actions. */
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProductDetail productId={params.id} />;
}
