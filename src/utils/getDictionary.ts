import "server-only";

import enDictionary from "../dictionaries/en.json";

export type Dictionary = typeof enDictionary;

const dictionaries: Record<"en" | "ka", () => Promise<Dictionary>> = {
  en: () => import("../dictionaries/en.json").then((module) => module.default),
  ka: () => import("../dictionaries/ka.json").then((module) => module.default),
};

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  return locale === "en" ? dictionaries.en() : dictionaries.ka();
};
