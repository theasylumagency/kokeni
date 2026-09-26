import type { Locale } from "@/lib/catalog/types";
import ContactActions from "./ContactActions";
import styles from "./TypeCatalog.module.css";

/** Not a category: Kokeni's ability to design and make what is not in the catalog yet. */
export default function CustomProjects({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const steps = en
    ? [["Design", "Drawing, dimensions, material and finish."], ["Prototype", "A sample you can hold and check."], ["Manufacture", "The run, to your deadline."]]
    : [["დიზაინი", "ნახაზი, ზომები, მასალა და დამუშავება."], ["პროტოტიპი", "ნიმუში, რომელსაც ხელით შეამოწმებთ."], ["წარმოება", "ტირაჟი — თქვენს ვადაში."]];
  return <section className={styles.custom} aria-labelledby="custom-projects">
    <div className={styles.customText}>
      <span className={styles.eyebrowLight}>{en ? "CUSTOM PROJECTS" : "ინდივიდუალური პროექტი"}</span>
      <h2 id="custom-projects">{en ? "Not in the catalog? We will design it and make it." : "კატალოგში არ არის? დავაპროექტებთ და დავამზადებთ."}</h2>
      <p>{en
        ? "Bring an object, a sketch, a reference or just the idea. We work out the construction, make a prototype, then the production run."
        : "მოგვიტანეთ ნივთი, ესკიზი, მაგალითი ან უბრალოდ იდეა. ვადგენთ კონსტრუქციას, ვამზადებთ პროტოტიპს, შემდეგ კი — ტირაჟს."}</p>
      <ContactActions locale={locale} context="custom_project" subject={en ? "A custom project" : "ინდივიდუალური პროექტი"} className={styles.customActions} />
    </div>
    <ol className={styles.customSteps}>
      {steps.map(([title, text], index) => <li key={title}>
        <svg viewBox="0 0 96 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          {index === 0 && <><path d="M18 12h60v40H18z" strokeDasharray="3 3" /><path d="M18 12h28v40H18z" /><path d="M52 12h26v40H52z" /><path d="M18 4v4M78 4v4M18 6h60" stroke="var(--color-primary-bright)" /><circle cx="65" cy="32" r="7" stroke="var(--color-primary-bright)" /></>}
          {index === 1 && <><path d="M48 50 20 42V10l28 8z" /><path d="M48 50l28-8V10l-28 8z" /><path d="M48 18v32" /><path d="M26 18l16 5M26 25l16 5M26 32l10 3" opacity=".6" /></>}
          {index === 2 && <><path d="M22 46l26 8 26-8-26-8z" /><path d="M22 38l26 8 26-8-26-8z" /><path d="M22 30l26 8 26-8-26-8z" /><path d="M22 30v16M74 30v16M48 38v16" opacity=".6" /><path d="M48 22v-12M44 14l4-4 4 4" stroke="var(--color-primary-bright)" /></>}
        </svg>
        <span className={styles.customStepNo}>0{index + 1}</span>
        <strong>{title}</strong>
        <span>{text}</span>
      </li>)}
    </ol>
  </section>;
}
