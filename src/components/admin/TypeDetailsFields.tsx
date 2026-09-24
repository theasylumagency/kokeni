import type { Category, Product } from "@/lib/catalog/types";
import { illustrationFor } from "@/lib/catalog/typeCatalog";
import CatalogAttributeEditor from "./CatalogAttributeEditor";

const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-blue-600";

export default function TypeDetailsFields({ category, categories, products }: { category: Category | null; categories: Category[]; products: Product[] }) {
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
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold text-gray-900">თანმხლები ნივთები</legend><p className="text-sm text-gray-600">აირჩიეთ ტიპები, რომლებიც ამ ნივთთან ერთად შეიძლება შეუკვეთონ. არჩეული რიგი მიჰყვება ქვემოთ მოცემულ სიას.</p>
      {categories.filter(item => item.id !== category?.id).map(item => <label key={item.id} className="flex items-start gap-3 text-sm text-gray-700"><input type="checkbox" name="relatedCategoryIds" value={item.id} defaultChecked={category?.relatedCategoryIds?.includes(item.id)} className="mt-1" />{item.name.ka}{!item.isActive ? " (არააქტიური)" : ""}</label>)}
    </fieldset>
  </div>;
}
