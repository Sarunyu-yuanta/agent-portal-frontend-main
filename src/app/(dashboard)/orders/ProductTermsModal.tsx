"use client";

/**
 * The product's terms, over the book — what "ดูรายละเอียดสินค้า" opens on
 * `/orders/[productId]`.
 *
 * A modal rather than a link to the catalogue page: the IC opening it is in the
 * middle of a book and wants the coupon or the barriers for a moment, not to
 * leave the bookings behind. The full page is still one click away at the
 * bottom.
 *
 * The rows are the product page's own (`structuredProductRows`,
 * `thaiProductRows`), so the two can never disagree about a term — and the
 * documents are offered through the same `DocumentDownloadMenu`, since an IC
 * looking at the terms mid-book is often about to send them to a client.
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@sarunyu/system-one";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import {
  DetailTable,
  structuredProductRows,
  type DetailRow,
} from "../client/[id]/StructuredProductDetail";
import { DocumentDownloadMenu } from "../client/[id]/DocumentDownloadMenu";
import { FCNPresentationModal } from "../client/[id]/FCNPresentationModal";
import { PackageFilesModal } from "../client/[id]/PackageFilesModal";
import { thaiProductRows } from "../client/[id]/ThaiStructuredProductDetail";
import { THAI_STRUCTURED_PRODUCTS, thaiBookableId } from "../client/[id]/thai-structured-data";
import { catalogHrefFor, type BookableProduct } from "./bookable-products";
import { ProductLogos } from "./ProductLogos";

/**
 * The rows for whichever desk wrote the product. The Thai desk's bookable shape
 * is a conversion that drops the theme's own columns, so those come from the
 * source row rather than from `product`.
 */
function termsFor(product: BookableProduct): DetailRow[] {
  if (product.id.startsWith("thai-")) {
    const source = THAI_STRUCTURED_PRODUCTS.find((p) => thaiBookableId(p.theme) === product.id);
    if (source) return thaiProductRows(source);
  }
  // `link` is the catalogue page's pointer to the product family; it goes
  // nowhere from here, so it reads as plain text.
  return structuredProductRows(product).map((row) => ({ ...row, link: false }));
}

export function ProductTermsModal({
  product,
  open,
  onClose,
}: {
  product: BookableProduct;
  open: boolean;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<"presentation" | "package" | null>(null);

  // One modal at a time: the document opens in place of the terms, so two
  // sheets never stack on a phone.
  const openDoc = (which: "presentation" | "package") => {
    onClose();
    setDoc(which);
  };

  return (
    <>
      <ResponsiveBottomSheetModal
        open={open}
        onClose={onClose}
        title="รายละเอียดสินค้า"
        titleId="product-terms-title"
        desktopMaxWidth="max-w-[614px]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-3 md:px-6">
          <div className="flex items-center gap-3">
            <ProductLogos logos={product.logos} />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="type-body-1 truncate font-bold text-foreground">{product.underlying}</p>
              <p className="type-caption text-muted-foreground">Underlying</p>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <p className="type-body-1 font-bold text-[#0a6ee7]">{product.coupon}</p>
              <p className="type-caption text-muted-foreground">Coupon</p>
            </div>
          </div>

          <DetailTable rows={termsFor(product)} />

          {/* Stacked and centred: the documents first, as the one primary
              action; the full page under it as a plain button, since leaving
              is the quieter choice here. */}
          {/* One shared width so the pair reads as a set; the height is
              inline on the plain button because the library's own size
              classes sit outside Tailwind's layers and would win over a class. */}
          <div className="mx-auto flex w-[240px] max-w-full flex-col gap-2">
            <DocumentDownloadMenu
              onPresentation={() => openDoc("presentation")}
              onPackage={() => openDoc("package")}
            />
            <Link href={catalogHrefFor(product)} className="block">
              <Button
                variant="plain"
                size="md"
                className="w-full"
                style={{ height: 48 }}
                rightIcon={<ArrowRightIcon size={16} />}
              >
                ไปหน้าสินค้า
              </Button>
            </Link>
          </div>
        </div>
      </ResponsiveBottomSheetModal>

      <FCNPresentationModal
        product={product}
        open={doc === "presentation"}
        onClose={() => setDoc(null)}
      />
      <PackageFilesModal product={product} open={doc === "package"} onClose={() => setDoc(null)} />
    </>
  );
}
