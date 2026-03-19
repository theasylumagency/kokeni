import Image from "next/image";

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/admin/actions";
import type { Category, Group, Product } from "@/lib/catalog/types";
import AdvancedImageUploader from "./AdvancedImageUploader";

type ProductPanelProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
};

const panelClass = "border-2 border-black bg-white p-8";
const inputClass =
  "w-full bg-[#F5F2ED] border-2 border-black p-4 font-mono text-sm focus:outline-none focus:border-primary rounded-none";
const textareaClass =
  "min-h-28 w-full bg-[#F5F2ED] border-2 border-black p-4 font-mono text-sm focus:outline-none focus:border-primary rounded-none resize-y";
const checkboxClass = "w-5 h-5 border-2 border-black focus:ring-0 rounded-none accent-primary text-primary";
const fileInputClass =
  "block w-full border-2 border-dashed border-black bg-[#F5F2ED] p-4 font-mono text-[10px] uppercase tracking-widest file:mr-4 file:border-2 file:border-black file:bg-primary file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:text-white file:rounded-none file:cursor-pointer hover:bg-black/5 transition-colors";
const labelClass = "block font-mono text-[10px] tracking-widest mb-2 opacity-60 uppercase";

export default function ProductPanel({
  groups,
  categories,
  products,
}: ProductPanelProps) {
  return (
    <div className="space-y-8">
      {/* Add Product */}
      <section className={panelClass}>
        <div className="mb-8 space-y-2 border-b-2 border-black pb-4">
          <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase text-primary">MODULE: 04 / PROD_CREATE</h3>
          <h2 className="font-black text-2xl uppercase tracking-tight">პროდუქტის დამატება</h2>
          <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">
            პროდუქტი აუცილებლად ეკუთვნის კონკრეტულ კატეგორიას. მისი მიმდევრობა
            იმართება მხოლოდ იმავე კატეგორიის შიგნით.
          </p>
        </div>

        {categories.length ? (
          <form action={createProductAction} className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3 border-b-2 border-black pb-8">
              <label className="block lg:col-span-1">
                <span className={labelClass}>კატეგორია / CLASSIFICATION</span>
                <select name="categoryId" required className={`${inputClass} appearance-none cursor-pointer border-dashed border-black/30`}>
                  {groups.map((group) => {
                    const groupCategories = categories.filter(
                      (category) => category.groupId === group.id
                    );

                    if (!groupCategories.length) {
                      return null;
                    }

                    return (
                      <optgroup key={group.id} label={group.name.ka}>
                        {groupCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name.ka}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>დასახელება GE / PROD_NAME_GE</span>
                <input name="nameKa" required className={inputClass} placeholder="მნიშვნელობა..." />
              </label>

              <label className="block">
                <span className={labelClass}>დასახელება EN / PROD_NAME_EN</span>
                <input name="nameEn" className={inputClass} placeholder="ENTRY_VALUE..." />
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 border-b-2 border-black pb-8">
              <div className="space-y-6">
                <label className="block">
                  <span className={labelClass}>მოკლე აღწერა GE / SHORT_SUMMARY_GE</span>
                  <textarea name="shortDescriptionKa" required className={textareaClass} placeholder="BRIEF_DESCRIPTION..." />
                </label>
                <label className="block">
                  <span className={labelClass}>სრული აღწერა GE / FULL_MANIFEST_GE</span>
                  <textarea name="longDescriptionKa" className={textareaClass} placeholder="TECHNICAL_SPECIFICATIONS..." />
                </label>
              </div>

              <div className="space-y-6">
                <label className="block">
                  <span className={labelClass}>მოკლე აღწერა EN / SHORT_SUMMARY_EN</span>
                  <textarea name="shortDescriptionEn" className={textareaClass} placeholder="BRIEF_DESCRIPTION..." />
                </label>
                <label className="block">
                  <span className={labelClass}>სრული აღწერა EN / FULL_MANIFEST_EN</span>
                  <textarea name="longDescriptionEn" className={textareaClass} placeholder="TECHNICAL_SPECIFICATIONS..." />
                </label>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 border-b-2 border-black pb-8">
              <label className="block">
                <span className={labelClass}>ფასი / PRICING_MODEL</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  <select name="priceMode" defaultValue="contact" className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="contact">დაგვიკავშირდით / CONTACT_US</option>
                    <option value="fixed">მიუთითე ფასი / FIXED</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    name="priceAmount"
                    className={inputClass}
                    placeholder="VALUE (₾)"
                  />
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer self-start lg:mt-6">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked
                  className={checkboxClass}
                />
                <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">
                  გამოქვეყნებული პროდუქტი / PUBLISHED_STATE
                </span>
              </label>
            </div>

            <div className="pb-4">
                <span className={labelClass}>ფოტოები / VISUAL_ASSET</span>
                <AdvancedImageUploader />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-4 px-8 font-black font-mono text-[12px] tracking-[0.2em] border-2 border-black hover:bg-black transition-all uppercase"
            >
              PUBLISH_MANIFEST / პროდუქტის დამატება
            </button>
          </form>
        ) : (
          <div className="border-2 border-dashed border-black/30 bg-[#F5F2ED] p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              MISSING_DEPENDENCY / ჯერ დაამატეთ კატეგორია პროდუქტის შესაქმნელად.
            </p>
          </div>
        )}
      </section>

      {/* List Products */}
      <section className={panelClass}>
        <div className="mb-8 border-b-2 border-black pb-4">
          <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase mb-2">DIRECTORY / დირექტორია</h3>
          <h2 className="font-black text-2xl uppercase tracking-tight">პროდუქტების მართვა</h2>
        </div>

        <div className="space-y-8">
          {groups.length ? (
            groups.map((group) => {
              const groupCategories = categories.filter(
                (category) => category.groupId === group.id
              );

              if (!groupCategories.length) {
                return null;
              }

              return (
                <section
                  key={group.id}
                  className="border-2 border-black bg-[#F5F2ED] p-6 lg:p-8"
                >
                  <div className="mb-6 border-b-2 border-black pb-4">
                    <p className="font-mono text-[10px] opacity-50 tracking-widest uppercase mb-1">
                      MASTER_GROUP
                    </p>
                    <h3 className="font-black text-xl uppercase tracking-tighter">
                      {group.name.ka}
                    </h3>
                  </div>

                  <div className="space-y-8">
                    {groupCategories.map((category) => {
                      const categoryProducts = products.filter(
                        (product) => product.categoryId === category.id
                      );

                      return (
                        <div
                          key={category.id}
                          className="border-2 border-black bg-white p-6"
                        >
                          <div className="mb-6 flex items-center justify-between gap-3 border-b border-black/20 pb-4">
                            <div>
                              <p className="font-mono text-[10px] opacity-50 tracking-widest uppercase mb-1">
                                კატეგორია / CATEGORY
                              </p>
                              <h4 className="font-bold text-lg uppercase tracking-tight">
                                {category.name.ka}
                              </h4>
                            </div>
                            <span className="font-mono text-[10px] tracking-widest uppercase border-2 border-black bg-[#F5F2ED] px-3 py-1">
                              {categoryProducts.length} PROD
                            </span>
                          </div>

                          {categoryProducts.length ? (
                            <div className="space-y-6">
                              {categoryProducts.map((product) => (
                                <details
                                  key={product.id}
                                  className="group/item border-2 border-black bg-white transition-colors"
                                >
                                  <summary className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-[#F5F2ED] select-none transition-colors">
                                    <div>
                                      <h5 className="font-bold text-lg uppercase tracking-tight group-open/item:text-primary transition-colors">
                                        {product.name.ka}
                                      </h5>
                                      <p className="font-mono text-[10px] opacity-70 tracking-widest uppercase mt-2">
                                        {product.isPublished
                                          ? "LIVE / გამოქვეყნებულია"
                                          : "DRAFT / დრაფტი"}
                                        {" • "}
                                        {product.price.mode === "contact"
                                          ? "PRICE: CONTACT_US"
                                          : `PRICE: ${product.price.amount} ${product.price.currency}`}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 font-mono text-[10px] tracking-widest uppercase">
                                      <div className="border-2 border-black bg-white px-3 py-1">
                                        INDEX #{product.order}
                                      </div>
                                      <div className="border-2 border-black bg-white px-3 py-1">
                                        ASSETS: {product.images.length}
                                      </div>
                                      <p className="font-bold tracking-[0.2em] text-black border-2 border-black px-4 py-2 bg-white group-open/item:bg-black group-open/item:text-white transition-colors">
                                         EDIT_PRODUCT
                                      </p>
                                    </div>
                                  </summary>

                                  <form action={updateProductAction} className="space-y-6 p-6 border-t border-black/20 bg-[#F5F2ED] cursor-default">
                                    <input type="hidden" name="id" value={product.id} />

                                    <div className="grid gap-6 lg:grid-cols-3">
                                      <label className="block lg:col-span-2">
                                        <span className={labelClass}>
                                          კატეგორია / CLASSIFICATION
                                        </span>
                                        <select
                                          name="categoryId"
                                          defaultValue={product.categoryId}
                                          className={`${inputClass} appearance-none cursor-pointer`}
                                        >
                                          {groups.map((itemGroup) => {
                                            const itemCategories = categories.filter(
                                              (itemCategory) =>
                                                itemCategory.groupId === itemGroup.id
                                            );

                                            if (!itemCategories.length) {
                                              return null;
                                            }

                                            return (
                                              <optgroup
                                                key={itemGroup.id}
                                                label={itemGroup.name.ka}
                                              >
                                                {itemCategories.map((itemCategory) => (
                                                  <option
                                                    key={itemCategory.id}
                                                    value={itemCategory.id}
                                                  >
                                                    {itemCategory.name.ka}
                                                  </option>
                                                ))}
                                              </optgroup>
                                            );
                                          })}
                                        </select>
                                      </label>

                                      <label className="block">
                                        <span className={labelClass}>
                                          მიმდევრობა / INDEX
                                        </span>
                                        <input
                                          type="number"
                                          min={1}
                                          name="order"
                                          required
                                          defaultValue={product.order}
                                          className={inputClass}
                                        />
                                      </label>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                      <label className="block">
                                        <span className={labelClass}>
                                          დასახელება GE / PROD_NAME_GE
                                        </span>
                                        <input
                                          name="nameKa"
                                          required
                                          defaultValue={product.name.ka}
                                          className={inputClass}
                                        />
                                      </label>

                                      <label className="block">
                                        <span className={labelClass}>
                                          დასახელება EN / PROD_NAME_EN
                                        </span>
                                        <input
                                          name="nameEn"
                                          defaultValue={product.name.en ?? ""}
                                          className={inputClass}
                                        />
                                      </label>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                      <label className="block">
                                        <span className={labelClass}>
                                          მოკლე აღწერა GE / SHORT_SUMMARY_GE
                                        </span>
                                        <textarea
                                          name="shortDescriptionKa"
                                          required
                                          defaultValue={product.shortDescription.ka}
                                          className={textareaClass}
                                        />
                                      </label>

                                      <label className="block">
                                        <span className={labelClass}>
                                          მოკლე აღწერა EN / SHORT_SUMMARY_EN
                                        </span>
                                        <textarea
                                          name="shortDescriptionEn"
                                          defaultValue={product.shortDescription.en ?? ""}
                                          className={textareaClass}
                                        />
                                      </label>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                      <label className="block">
                                        <span className={labelClass}>
                                          სრული აღწერა GE / FULL_MANIFEST_GE
                                        </span>
                                        <textarea
                                          name="longDescriptionKa"
                                          defaultValue={product.longDescription?.ka ?? ""}
                                          className={textareaClass}
                                        />
                                      </label>

                                      <label className="block">
                                        <span className={labelClass}>
                                          სრული აღწერა EN / FULL_MANIFEST_EN
                                        </span>
                                        <textarea
                                          name="longDescriptionEn"
                                          defaultValue={product.longDescription?.en ?? ""}
                                          className={textareaClass}
                                        />
                                      </label>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                      <label className="block">
                                        <span className={labelClass}>
                                          ფასი / PRICING_MODEL
                                        </span>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                          <select
                                            name="priceMode"
                                            defaultValue={product.price.mode}
                                            className={`${inputClass} appearance-none cursor-pointer`}
                                          >
                                            <option value="contact">
                                              CONTACT_US
                                            </option>
                                            <option value="fixed">FIXED_PRICE</option>
                                          </select>
                                          <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            name="priceAmount"
                                            defaultValue={
                                              product.price.mode === "fixed"
                                                ? product.price.amount
                                                : ""
                                            }
                                            className={inputClass}
                                            placeholder="VALUE (₾)"
                                          />
                                        </div>
                                      </label>

                                      <label className="flex items-center gap-3 cursor-pointer self-start lg:mt-6">
                                        <input
                                          type="checkbox"
                                          name="isPublished"
                                          defaultChecked={product.isPublished}
                                          className={checkboxClass}
                                        />
                                        <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">
                                          გამოქვეყნებული პროდუქტი / PUBLISHED_STATE
                                        </span>
                                      </label>
                                    </div>

                                    <div className="pt-4 border-t-2 border-black">
                                       <span className={labelClass}>ფოტოები / VISUAL_ASSET</span>
                                       <AdvancedImageUploader existingImages={product.images} />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-black">
                                      <button
                                        type="submit"
                                        className="bg-black text-white px-8 py-3 font-mono text-[11px] font-bold tracking-widest hover:bg-primary transition-all uppercase"
                                      >
                                        UPDATE_MANIFEST / შენახვა
                                      </button>
                                      <button
                                        formAction={deleteProductAction}
                                        className="border-2 border-black px-8 py-3 font-mono text-[11px] font-bold tracking-widest hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a] transition-all uppercase text-[#ba1a1a]"
                                      >
                                        REMOVE_PROD / პროდუქტის წაშლა
                                      </button>
                                    </div>
                                  </form>
                                </details>
                              ))}
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-black/20 bg-[#F5F2ED] p-6 mt-4 text-center">
                              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                                EMPTY_DIRECTORY / პროდუქტი არ მოიძებნა
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="border-2 border-dashed border-black/30 bg-[#F5F2ED] p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                EMPTY_MANIFEST / ჯერ ჯგუფი დამატებული არ არის.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
