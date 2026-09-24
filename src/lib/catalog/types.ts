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
  name: string;
};

export type HomeDirectionGroup = {
  id: string;
  order: number;
  orderLabel: string;
  name: string;
  categories: HomeDirectionCategory[];
};
