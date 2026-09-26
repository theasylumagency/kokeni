import type { Locale, Product, TypeIllustration } from "./types";
import type { ResolvedFamily } from "./composition";
import { familyExamples } from "./composition";
import { illustrationFor, localized, typeCover, typePath } from "./typeCatalog";
import { familyPath } from "./urls";

export type FamilyEntrance = { href: string; drawing: TypeIllustration; photo?: { src: string; alt: string }; count: number };

/** Where a family card leads, which drawing marks it, and the photo that proves it is really made. */
export function familyEntrance(family: ResolvedFamily, locale: Locale, products: Product[]): FamilyEntrance {
  const first = family.members[0];
  const href = family.landing ? familyPath(locale, family.config.id) : typePath(locale, first);
  const drawing = family.config.drawing || illustrationFor(first);
  let photo: FamilyEntrance["photo"];
  for (const member of family.members) {
    const cover = typeCover(member, products);
    const src = cover ? [...cover.images].sort((a, b) => a.order - b.order)[0]?.src : undefined;
    if (cover && src) { photo = { src, alt: localized(cover.name, locale) }; break; }
  }
  return { href, drawing, photo, count: familyExamples(family.members, products).length };
}
