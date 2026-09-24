import type { Locale } from "@/lib/catalog/types";

/**
 * Single source for public contact details.
 * `messenger` is the number used for WhatsApp and Viber (international format, digits only after +).
 */
export const CONTACT = {
  email: "manufacturing@kokeni.ge",
  phone: "+995599510338",
  phoneDisplay: "+995 599 51 03 38",
  messenger: "+995599510338",
} as const;

/** Pre-filled inquiry so the first message already carries what the workshop needs. */
export function inquiryText(locale: Locale, subject?: string): string {
  if (locale === "en") {
    return [`Hello! I'm interested in${subject ? `: ${subject}` : " an order"}.`, "Quantity: ", "Needed by: ", "Organisation: "].join("\n");
  }
  return [`გამარჯობა! მაინტერესებს${subject ? `: ${subject}` : " შეკვეთა"}.`, "რაოდენობა: ", "როდის გჭირდებათ: ", "ორგანიზაცია: "].join("\n");
}

export const whatsappUrl = (text: string): string =>
  `https://wa.me/${CONTACT.messenger.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const viberUrl = (text: string): string =>
  `viber://chat?number=${encodeURIComponent(CONTACT.messenger)}&draft=${encodeURIComponent(text)}`;

export const mailtoUrl = (subject: string, body: string): string =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const telUrl = (): string => `tel:${CONTACT.phone}`;
