import type { Category, Product } from "@/lib/catalog/types";
import { illustrationFor } from "@/lib/catalog/typeCatalog";
import CatalogAttributeEditor from "./CatalogAttributeEditor";

const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-blue-600";

export default function TypeDetailsFields({ category, categories, products }: { category: Category | null; categories: Category[]; products: Product[] }) {
  const terms = category?.orderTerms;
  return <div className="space-y-6 border-t border-gray-200 pt-6">
    <div><h3 className="font-semibold text-gray-900">ნივთის ტიპის გვერდი</h3><p className="mt-2 text-sm text-gray-600">ეს ინფორმაცია გამოჩნდება კატალოგში. მთავარ გვერდზე არსებულ განაწილებას არ ცვლის.</p></div>
    <label className="block text-sm text-gray-700">მოკლე აღწერა (ქართულად)<textarea name="descriptionKa" rows={3} maxLength={2000} defaultValue={category?.description?.ka || ""} className={inputClass} placeholder="რისთვის გამოიყენება ეს ნივთი და როგორ შეიძლება მისი მორგება?" /></label>
    <label className="block text-sm text-gray-700">მოკლე აღწერა (ინგლისურად)<textarea name="descriptionEn" rows={3} maxLength={2000} defaultValue={category?.description?.en || ""} className={inputClass} /></label>
    <label className="block text-sm text-gray-700">პოზიცია კატალოგის შესასვლელში<input type="number" name="catalogOrder" min={1} step={1} defaultValue={category?.catalogOrder || ""} className={inputClass} placeholder="ავტომატური" /><span className="mt-1 block text-xs text-gray-500">მაგ. 1 — პირველი. ეს ველი მთავარ გვერდზე მიმდევრობას არ ცვლის.</span></label>
    <label className="block text-sm text-gray-700">სქემატური გამოსახულება<select name="illustration" defaultValue={category ? illustrationFor(category) : "cover"} className={inputClass}>
      <option value="cover">ყდა</option><option value="menu">მენიუ</option><option value="notebook">ბლოკნოტი</option><option value="holder">ჩასადები / საქაღალდე</option><option value="box">ყუთი / მედლის ჩასადები</option><option value="print">ბეჭდური ფურცლები</option>
    </select></label>
    <label className="block text-sm text-gray-700">მთავარი ფოტო<select name="coverProductId" defaultValue={category?.coverProductId || ""} className={inputClass}>
      <option value="">ავტომატურად — პირველი ნამუშევრიდან</option>
      {products.filter(product => product.categoryId === category?.id).map(product => <option key={product.id} value={product.id}>{product.name.ka}{!product.isPublished ? " (გამოუქვეყნებელი)" : ""}</option>)}
    </select><span className="mt-1 block text-xs text-gray-500">გამოიყენება მხოლოდ გამოქვეყნებული ნამუშევრის ფოტო. ფოტოს გარეშე ჩანს სქემა.</span></label>
    <CatalogAttributeEditor name="customizationJson" initial={category?.customization} title="რა შეიძლება შეიცვალოს" help="ჩაწერეთ რეალურად ხელმისაწვდომი არჩევანი. მაგალითად: ფორმატი — A4, A5 ან შეთანხმებით; მასალა — PVC ან ნატურალური ტყავი. ეს შესაძლებლობების აღწერაა და არა ყველა კომბინაციის დაპირება." />
    <fieldset className="space-y-4">
      <legend className="mb-2 text-sm font-semibold text-gray-900">შეკვეთის პირობები</legend>
      <p className="text-sm text-gray-600">ჩანს ტიპის გვერდზე, ბარათზე და ამ ტიპის ნამუშევრებზე. ცარიელი ველი საიტზე არ გამოჩნდება — მაგალითად, თუ ფასს არ მიუთითებთ, დარჩება „ფასი შეთანხმებით“.</p>
      <label className="block text-sm text-gray-700">მინიმალური რაოდენობა (ცალი)<input type="number" name="orderMinQuantity" min={1} step={1} defaultValue={terms?.minQuantity ?? ""} className={inputClass} placeholder="მაგ. 50" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-gray-700">დამზადების ვადა — დან (სამუშაო დღე)<input type="number" name="orderLeadMin" min={1} step={1} defaultValue={terms?.leadTimeDays?.min ?? ""} className={inputClass} placeholder="მაგ. 10" /></label>
        <label className="block text-sm text-gray-700">— მდე (არასავალდებულო)<input type="number" name="orderLeadMax" min={1} step={1} defaultValue={terms?.leadTimeDays?.max ?? ""} className={inputClass} placeholder="მაგ. 14" /></label>
      </div>
      <label className="block text-sm text-gray-700">ფასი ერთეულზე — დან (₾, არასავალდებულო)<input type="text" inputMode="decimal" name="orderPriceFrom" defaultValue={terms?.priceFrom ?? ""} className={inputClass} placeholder="ცარიელი = ფასი შეთანხმებით" /><span className="mt-1 block text-xs text-gray-500">საიტზე გამოჩნდება როგორც „12 ₾-დან / ცალი“. ცალკეულ ნამუშევარზე მითითებული ფიქსირებული ფასი უპირატესია.</span></label>
      <label className="block text-sm text-gray-700">შენიშვნა (ქართულად, არასავალდებულო)<input name="orderNoteKa" maxLength={500} defaultValue={terms?.note?.ka || ""} className={inputClass} placeholder="მაგ. ფასი დამოკიდებულია ტირაჟსა და მასალაზე" /></label>
      <label className="block text-sm text-gray-700">შენიშვნა (ინგლისურად)<input name="orderNoteEn" maxLength={500} defaultValue={terms?.note?.en || ""} className={inputClass} /></label>
    </fieldset>
    <CatalogAttributeEditor name="faqJson" initial={category?.faq} multiline maxValueLength={2000} title="ხშირი კითხვები"
      help="ტიპის გვერდზე ავტომატურად ჩანს კითხვები მინიმალურ რაოდენობაზე, ვადაზე, ფასსა და შეკვეთის წესზე (შეკვეთის პირობებიდან). აქ დაამატეთ სხვა კითხვები, რასაც კლიენტები სვამენ: მასალა, ლოგოს ტვიფრი, საკუთარი დიზაინი, ნიმუში, მიწოდება. პასუხი — 1–3 წინადადება, მხოლოდ ზუსტი ინფორმაცია. Google და AI ასისტენტები ამ პასუხებს პირდაპირ იყენებენ."
      wording={{ label: "კითხვა (ქართულად)", value: "პასუხი (ქართულად)", labelEn: "Question (EN)", valueEn: "Answer (EN)", labelPlaceholder: "მაგ. შეიძლება ლოგოს ტვიფრი?", valuePlaceholder: "მაგ. დიახ — ოქროს, ვერცხლის ან ბრმა ტვიფრით.", add: "+ კითხვის დამატება", remove: "კითხვის წაშლა" }} />
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold text-gray-900">თანმხლები ნივთები</legend><p className="text-sm text-gray-600">აირჩიეთ ტიპები, რომლებიც ამ ნივთთან ერთად შეიძლება შეუკვეთონ. არჩეული რიგი მიჰყვება ქვემოთ მოცემულ სიას.</p>
      {categories.filter(item => item.id !== category?.id).map(item => <label key={item.id} className="flex items-start gap-3 text-sm text-gray-700"><input type="checkbox" name="relatedCategoryIds" value={item.id} defaultChecked={category?.relatedCategoryIds?.includes(item.id)} className="mt-1" />{item.name.ka}{!item.isActive ? " (არააქტიური)" : ""}</label>)}
    </fieldset>
  </div>;
}
