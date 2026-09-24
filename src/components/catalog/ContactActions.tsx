import type { Locale } from "@/lib/catalog/types";
import { CONTACT, inquiryText, mailtoUrl, telUrl, viberUrl, whatsappUrl } from "@/lib/contact";
import styles from "./TypeCatalog.module.css";

type Props = {
  locale: Locale;
  /** What the visitor is asking about, e.g. "KKN-DC-001 — დიპლომის ყდა". Pre-fills the message. */
  subject?: string;
  /** Reported to GA4 as lead_context (item type slug or product code). */
  context?: string;
  className?: string;
};

/** WhatsApp / Viber / phone / e-mail — each tagged as a GA4 generate_lead. */
export default function ContactActions({ locale, subject, context = "catalog", className }: Props) {
  const text = inquiryText(locale, subject);
  const emailSubject = subject || (locale === "en" ? "Order inquiry" : "შეკვეთის მოთხოვნა");
  const ga = (method: string) => ({ "data-ga-event": "generate_lead", "data-ga-method": method, "data-ga-lead-context": context });
  return <div className={`${styles.contactActions} ${className || ""}`}>
    <a className={`${styles.contactBtn} ${styles.contactBtnPrimary}`} href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer" {...ga("whatsapp")}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>
      WhatsApp
    </a>
    <a className={styles.contactBtn} href={viberUrl(text)} {...ga("viber")}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 2.8c5 0 8.4 1.6 8.4 7.6s-3.4 7.4-8.4 7.4c-.8 0-1.5 0-2.2-.1L6.5 21v-3.9c-2.2-1.1-2.9-3.3-2.9-6.7 0-6 3.4-7.6 8.4-7.6Z"/><path d="M9.4 7.8c.4-.3.9-.2 1.1.2l.6 1.2c.2.4 0 .8-.3 1-.3.3-.3.7 0 1.1.6.8 1.2 1.4 2 1.9.4.3.8.3 1 0 .3-.3.7-.5 1.1-.3l1.2.7c.4.2.5.7.2 1.1-.6.9-1.6 1.1-2.6.6a10 10 0 0 1-4.7-4.6c-.5-1-.3-2.2.4-2.9Z"/></svg>
      Viber
    </a>
    <a className={styles.contactBtn} href={telUrl()} {...ga("phone_mobile")}>{CONTACT.phoneDisplay}</a>
    <a className={styles.contactBtn} href={mailtoUrl(emailSubject, text)} {...ga("email")}>{locale === "en" ? "E-mail" : "ელფოსტა"}</a>
  </div>;
}
