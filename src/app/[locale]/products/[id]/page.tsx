"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Package, MapPin, Building2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { trackEvent } from "@/lib/analytics/track-event";
import { ContactSupplierModal } from "@/components/messaging/contact-supplier-modal";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { PageHeader, SkeletonImage } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import type { VerificationTier } from "@/lib/trust/types";

interface Company {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  owner_id: string;
  verification_tier: VerificationTier | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  specs: Record<string, string> | null;
  company_id: string;
  companies: Company | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  images: string[] | null;
}

function ImageGallery({ images }: { images: string[] }) {
  const t = useTranslations("Products");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
        <Package className="w-20 h-20 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SkeletonImage
        src={images[selectedIndex]}
        alt={t("detail.imageAlt")}
        loading="eager"
        wrapperClassName="aspect-[4/3] rounded-2xl"
        className="object-contain"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`w-14 h-14 flex-shrink-0 bg-muted rounded overflow-hidden border-2 transition-colors ${
                selectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <SkeletonImage src={src} alt="" wrapperClassName="w-full h-full" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  const thumbnail = product.images?.[0];

  return (
    <Link href={`/products/${product.id}`} className="block border border-slate-200 rounded-xl overflow-hidden hover:bg-muted/40">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/30" />
        )}
      </div>
      <div className="p-2">
        <h4 className="text-xs font-medium truncate">{product.name}</h4>
      </div>
    </Link>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations("Products");
  const reduce = useReducedMotion();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notFoundState, setNotFoundState] = React.useState(false);
  const [contactModalOpen, setContactModalOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadProduct() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("*, companies(id, name, city, province, owner_id, verification_tier)")
        .eq("id", productId)
        .single();

      if (error || !data) {
        setNotFoundState(true);
        setIsLoading(false);
        return;
      }

      setProduct(data as unknown as Product);
      trackEvent("product", productId, "view");

      const { data: related } = await supabase
        .from("products")
        .select("id, name, images")
        .eq("company_id", data.company_id)
        .neq("id", productId)
        .limit(7);

      setRelatedProducts((related as unknown as RelatedProduct[]) ?? []);
      setIsLoading(false);
    }

    loadProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-sm text-muted-foreground">{t("detail.loading")}</div>
      </div>
    );
  }

  if (notFoundState || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center gap-3">
        <Package className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">{t("detail.notFound")}</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          {t("detail.backToProducts")}
        </Link>
      </div>
    );
  }

  const company = product.companies;
  const companyLocation = [company?.city, company?.province].filter(Boolean).join(", ");
  const productImages = product.images ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        title={product.name}
        subtitle={company ? undefined : undefined}
      />
      {company && (
        <div className="mt-2 mb-0">
          <PageMeta items={[
            ...(companyLocation ? [{ label: t("detail.location"), value: companyLocation }] : []),
          ]} />
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-6 mt-6">
        {/* Left — gallery + details */}
        <div className="min-w-0 space-y-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
          >
            <ImageGallery images={productImages} />
          </motion.div>

          {product.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("detail.description")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("detail.specifications")}
              </p>
              <dl className="divide-y text-sm">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 py-1.5">
                    <dt className="text-muted-foreground capitalize text-xs">{key}</dt>
                    <dd className="text-xs font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Right — supplier sidecar */}
        <Sidecar>
          {company && (
            <>
              <p className="text-xs text-muted-foreground">{t("detail.soldBy")}</p>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <Link
                    href={`/companies/${company.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {company.name}
                  </Link>
                </div>
                <VerificationBadge tier={company.verification_tier ?? "none"} />
              </div>
              {companyLocation && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {companyLocation}
                </div>
              )}
              <div className="border-t pt-3 mt-1">
                {user ? (
                  <button
                    className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-full py-2 text-sm font-medium hover:bg-primary/90"
                    onClick={() => setContactModalOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t("detail.contactCompany")}
                  </button>
                ) : (
                  <Link href="/login" className="block">
                    <span className="w-full flex items-center justify-center gap-1.5 border border-primary text-primary rounded-full py-2 text-sm font-medium hover:bg-primary/5">
                      <MessageSquare className="w-4 h-4" />
                      {t("detail.signInToContact")}
                    </span>
                  </Link>
                )}
              </div>
            </>
          )}
        </Sidecar>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t("detail.relatedProducts")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {relatedProducts.map((p) => (
              <RelatedProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {company && contactModalOpen && (
        <ContactSupplierModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          companyId={company.id}
          companyName={company.name}
          companyOwnerId={company.owner_id}
        />
      )}
    </div>
  );
}
