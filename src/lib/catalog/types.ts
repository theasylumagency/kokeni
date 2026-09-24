export type Locale = "ka" | "en";

export type LocalizedText = {
  ka: string;
  en?: string;
};

export type OptionalLocalizedText = {
  ka?: string;
  en?: string;
};

export type CatalogAttribute = {
  label: LocalizedText;
  value: LocalizedText;
};

/** Typical order terms for an item type. Every field is optional; empty fields are not shown. */
export type OrderTerms = {
  minQuantity?: number;
  leadTimeDays?: { min: number; max?: number };
  /** Starting unit price in GEL, shown as "X ₾-დან". Omit to keep price by agreement. */
  priceFrom?: number;
  note?: OptionalLocalizedText;
};

export type TypeIllustration = "cover" | "menu" | "notebook" | "holder" | "box" | "print";

export type Group = {
  id: string;
  slug: string;
  legacySlugs?: string[];
  order: number;
  name: LocalizedText;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  groupId: string;
  slug: string;
  legacySlugs?: string[];
  order: number;
  name: LocalizedText;
  isActive: boolean;
  showOnHome?: boolean;
  description?: OptionalLocalizedText;
  customization?: CatalogAttribute[];
  relatedCategoryIds?: string[];
  coverProductId?: string;
  illustration?: TypeIllustration;
  catalogOrder?: number;
  orderTerms?: OrderTerms;
  /** Extra questions for this item type (label = question, value = answer). Shown after the automatic ones. */
  faq?: CatalogAttribute[];
  createdAt: string;
  updatedAt: string;
};

export type ProductPhotoKind =
  | "front_closed"
  | "interior_open"
  | "detail_spine";

export type ProductImage = {
  id: string;
  src: string;
  order: number;
  kind?: ProductPhotoKind;
  role?: "main" | "informative" | "detail" | "additional";
  label?: string;
  provenance?: {
    workflowId: string;
    outputId: string;
    referenceIds: string[];
    provider: string;
    model: string;
    generatedAt: string;
    quality: string;
    size: string;
    attempt: number;
    usage?: Record<string, unknown>;
  };
};

export type ProductPrice =
  | {
      mode: "contact";
      amount?: undefined;
      currency?: undefined;
    }
  | {
      mode: "fixed";
      amount: number;
      currency: "GEL";
    };

export type Product = {
  id: string;
  slug: string;
  code?: string;
  legacySlugs?: string[];
  categoryId: string;
  order: number;
  name: LocalizedText;
  shortDescription: LocalizedText;
  longDescription?: OptionalLocalizedText;
  price: ProductPrice;
  images: ProductImage[];
  originalImages?: ProductImage[];
  specifications?: CatalogAttribute[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomeDirectionCategory = {
  id: string;
  slug: string;
  name: string;
};

export type HomeDirectionGroup = {
  id: string;
  order: number;
  orderLabel: string;
  name: string;
  categories: HomeDirectionCategory[];
};
