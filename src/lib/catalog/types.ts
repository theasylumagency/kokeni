export type Locale = "ka" | "en";

export type LocalizedText = {
  ka: string;
  en?: string;
};

export type OptionalLocalizedText = {
  ka?: string;
  en?: string;
};

export type Group = {
  id: string;
  slug: string;
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
  order: number;
  name: LocalizedText;
  isActive: boolean;
  showOnHome?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  id: string;
  src: string;
  order: number;
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
  categoryId: string;
  order: number;
  name: LocalizedText;
  shortDescription: LocalizedText;
  longDescription?: OptionalLocalizedText;
  price: ProductPrice;
  images: ProductImage[];
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
