import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import type { Category, Group, Product } from "@/lib/catalog/types";

type CategoryPanelProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
};

const panelClass = "border-2 border-black bg-white p-8";
const inputClass =
  "w-full bg-[#F5F2ED] border-2 border-black p-4 font-mono text-sm focus:outline-none focus:border-primary rounded-none";
const checkboxClass = "w-5 h-5 border-2 border-black focus:ring-0 rounded-none accent-primary text-primary";
const labelClass = "block font-mono text-[10px] tracking-widest mb-2 opacity-60 uppercase";

export default function CategoryPanel({
  groups,
  categories,
  products,
}: CategoryPanelProps) {
  return (
    <div className="space-y-8">
      {/* Summary Box */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-black p-6 bg-white space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-mono font-bold text-[11px] tracking-widest uppercase text-primary">TOTAL_GROUPS</h4>
            <span className="material-symbols-outlined text-sm opacity-50" style={{ fontSize: '20px' }}>folder_open</span>
          </div>
          <p className="text-4xl font-black">{groups.length}</p>
        </div>
        <div className="border-2 border-black p-6 bg-white space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-mono font-bold text-[11px] tracking-widest uppercase text-primary">TOTAL_CATEGORIES</h4>
            <span className="material-symbols-outlined text-sm opacity-50" style={{ fontSize: '20px' }}>category</span>
          </div>
          <p className="text-4xl font-black">{categories.length}</p>
        </div>
        <div className="border-2 border-black p-6 bg-white space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-mono font-bold text-[11px] tracking-widest uppercase text-primary">TOTAL_PRODUCTS</h4>
            <span className="material-symbols-outlined text-sm opacity-50" style={{ fontSize: '20px' }}>inventory_2</span>
          </div>
          <p className="text-4xl font-black">{products.length}</p>
        </div>
      </section>

      {/* Add Category */}
      <section className={panelClass}>
        <div className="mb-8 space-y-2 border-b-2 border-black pb-4">
          <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase">DATA_ENTRY / მონაცემთა შეყვანა</h3>
          <h2 className="font-black text-2xl uppercase tracking-tight">კატეგორიის დამატება</h2>
          <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">
            კატეგორია აუცილებლად ეკუთვნის ერთ-ერთ ჯგუფს. ახალი კატეგორია ბოლო პოზიციას დაიკავებს.
          </p>
        </div>

        {groups.length ? (
          <form action={createCategoryAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block md:col-span-2">
                <span className={labelClass}>ჯგუფი / PARENT_GROUP</span>
                <select name="groupId" required className={`${inputClass} appearance-none cursor-pointer border-dashed border-black/30`}>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name.ka}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>დასახელება GE / LABEL GE</span>
                <input
                  name="nameKa"
                  required
                  className={inputClass}
                  placeholder="ENTRY_VALUE..."
                />
              </label>

              <label className="block">
                <span className={labelClass}>დასახელება EN / LABEL EN</span>
                <input name="nameEn" className={inputClass} placeholder="OPTIONAL_VALUE..." />
              </label>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className={checkboxClass}
                />
                <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">აქტიური / IS_ACTIVE</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="showOnHome"
                  className={checkboxClass}
                />
                <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">მთავარ გვერდზე ჩვენება / SHOW_ON_HOME</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-primary text-white py-4 px-8 font-black font-mono text-[12px] tracking-[0.2em] border-2 border-black hover:bg-black transition-all"
            >
              COMMIT_ADD / დამატება
            </button>
          </form>
        ) : (
          <div className="border-2 border-dashed border-black/30 bg-[#F5F2ED] p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              MISSING_DEPENDENCY / ჯერ დაამატეთ ჯგუფი
            </p>
          </div>
        )}
      </section>

      {/* List Categories */}
      <section className={panelClass}>
        <div className="mb-8 border-b-2 border-black pb-4">
          <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase mb-2">DIRECTORY / დირექტორია</h3>
          <h2 className="font-black text-2xl uppercase tracking-tight text-primary">კატეგორიების მართვა</h2>
        </div>

        <div className="space-y-8">
          {groups.length ? (
            groups.map((group) => {
              const groupCategories = categories.filter(
                (category) => category.groupId === group.id
              );

              return (
                <section
                  key={group.id}
                  className="border-2 border-black bg-[#F5F2ED] p-6 lg:p-8"
                >
                  <div className="mb-6 flex items-center justify-between gap-3 border-b-2 border-black pb-4">
                    <div>
                      <p className="font-mono text-[10px] opacity-50 tracking-widest uppercase mb-1">
                        MASTER_GROUP
                      </p>
                      <h3 className="font-black text-xl uppercase tracking-tighter">
                        {group.name.ka}
                      </h3>
                    </div>
                    <div className="font-mono text-[10px] tracking-widest uppercase border-2 border-black bg-white px-3 py-1">
                      {groupCategories.length} CATEGORIES
                    </div>
                  </div>

                  {groupCategories.length ? (
                    <div className="space-y-4 mt-6">
                      {groupCategories.map((category) => {
                        const productCount = products.filter(
                          (product) => product.categoryId === category.id
                        ).length;

                        return (
                          <details
                            key={category.id}
                            className="group/item border-2 border-black bg-white transition-colors"
                          >
                            <summary className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-[#F5F2ED] select-none transition-colors">
                              <div>
                                <h4 className="font-bold text-lg uppercase tracking-tight group-open/item:text-primary transition-colors">
                                  {category.name.ka}
                                </h4>
                                <p className="font-mono text-[10px] opacity-60 tracking-widest uppercase mt-1">
                                  PROD_COUNT: {productCount}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="font-mono text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1">
                                  INDEX #{category.order}
                                </div>
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-black border-2 border-black px-4 py-2 bg-white group-open/item:bg-black group-open/item:text-white transition-colors">
                                   EDIT_CATEGORY
                                </p>
                              </div>
                            </summary>

                            <form action={updateCategoryAction} className="space-y-6 p-6 border-t border-black/20 bg-[#F5F2ED] cursor-default">
                              <input type="hidden" name="id" value={category.id} />

                              <div className="grid gap-6 md:grid-cols-2">
                                <label className="block">
                                  <span className={labelClass}>ჯგუფი / PARENT_GROUP</span>
                                  <select
                                    name="groupId"
                                    defaultValue={category.groupId}
                                    className={`${inputClass} appearance-none cursor-pointer border-dashed border-black/30`}
                                  >
                                    {groups.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name.ka}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className={labelClass}>მიმდევრობა / INDEX</span>
                                  <input
                                    type="number"
                                    min={1}
                                    name="order"
                                    required
                                    defaultValue={category.order}
                                    className={inputClass}
                                  />
                                </label>
                              </div>

                              <div className="grid gap-6 md:grid-cols-2">
                                <label className="block">
                                  <span className={labelClass}>დასახელება GE / LABEL GE</span>
                                  <input
                                    name="nameKa"
                                    required
                                    defaultValue={category.name.ka}
                                    className={inputClass}
                                  />
                                </label>

                                <label className="block">
                                  <span className={labelClass}>დასახელება EN / LABEL EN</span>
                                  <input
                                    name="nameEn"
                                    defaultValue={category.name.en ?? ""}
                                    className={inputClass}
                                  />
                                </label>
                              </div>

                              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    name="isActive"
                                    defaultChecked={category.isActive}
                                    className={checkboxClass}
                                  />
                                  <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">
                                    აქტიური / IS_ACTIVE
                                  </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    name="showOnHome"
                                    defaultChecked={category.showOnHome}
                                    className={checkboxClass}
                                  />
                                  <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">
                                    მთავარ გვერდზე ჩვენება / SHOW_ON_HOME
                                  </span>
                                </label>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-black/10">
                                <button
                                  type="submit"
                                  className="bg-black text-white px-8 py-3 font-mono text-[11px] font-bold tracking-widest hover:bg-primary transition-all uppercase"
                                >
                                  UPDATE / შენახვა
                                </button>
                                <button
                                  formAction={deleteCategoryAction}
                                  className="border-2 border-black px-8 py-3 font-mono text-[11px] font-bold tracking-widest hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a] transition-all uppercase text-[#ba1a1a]"
                                >
                                  REMOVE / წაშლა
                                </button>
                              </div>
                            </form>
                          </details>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-black/20 bg-white p-6 mt-4 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                        EMPTY_DIRECTORY / კატეგორია არ მოიძებნა
                      </p>
                    </div>
                  )}
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
