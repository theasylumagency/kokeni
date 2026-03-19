import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
} from "@/app/admin/actions";
import type { Category, Group, Product } from "@/lib/catalog/types";

type GroupPanelProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
};

const panelClass = "border-2 border-black bg-white p-8";
const inputClass =
  "w-full bg-[#F5F2ED] border-2 border-black p-4 font-mono text-sm focus:outline-none focus:border-primary rounded-none";
const checkboxClass = "w-5 h-5 border-2 border-black focus:ring-0 rounded-none accent-primary text-primary";
const labelClass = "block font-mono text-[10px] tracking-widest mb-2 opacity-60 uppercase";

export default function GroupPanel({
  groups,
  categories,
  products,
}: GroupPanelProps) {
  return (
    <details className="group border-2 border-[#1A1A1A] bg-white cursor-pointer hover:border-primary transition-colors">
      <summary className="flex items-center justify-between p-6 bg-[#F5F2ED] select-none">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined pb-1">settings</span>
          <div>
             <h3 className="font-mono text-[11px] font-black tracking-widest uppercase">SYSTEM_CONFIG & ADVANCED</h3>
             <h2 className="font-black text-xl uppercase tracking-tight text-primary">ჯგუფების მართვა</h2>
          </div>
        </div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-black border-2 border-black px-4 py-2 group-open:bg-black group-open:text-white transition-colors">
           <span className="group-open:hidden">EXPAND_TOOLKIT</span>
           <span className="hidden group-open:inline">COLLAPSE_TOOLKIT</span>
        </p>
      </summary>
      
      <div className="p-8 space-y-8 border-t-2 border-black cursor-default">
        {/* Add Group */}
        <section className={panelClass}>
          <div className="mb-8 space-y-2 border-b-2 border-black pb-4">
            <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase">DATA_ENTRY / მონაცემთა შეყვანა</h3>
            <h2 className="font-black text-2xl uppercase tracking-tight">ჯგუფის დამატება</h2>
            <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">
              ჯგუფი არის ზედა დონე, რომელიც აერთიანებს კატეგორიებს.
            </p>
          </div>

          <form action={createGroupAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className={checkboxClass}
              />
              <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">აქტიური ჯგუფი / IS_ACTIVE</span>
            </label>

            <button
              type="submit"
              className="w-full md:w-auto bg-primary text-white py-4 px-8 font-black font-mono text-[12px] tracking-[0.2em] border-2 border-black hover:bg-black transition-all"
            >
              COMMIT_ADD / დამატება
            </button>
          </form>
        </section>

        {/* List Groups */}
        <section className={panelClass}>
          <div className="mb-8 border-b-2 border-black pb-4">
            <h3 className="font-mono text-[12px] font-black tracking-tighter uppercase mb-2">DIRECTORY / დირექტორია</h3>
            <h2 className="font-black text-2xl uppercase tracking-tight">ჯგუფების მართვა</h2>
          </div>

          <div className="space-y-6">
            {groups.length ? (
              groups.map((group) => {
                const categoryCount = categories.filter(
                  (category) => category.groupId === group.id
                ).length;

                return (
                  <details
                    key={group.id}
                    className="group/item border-2 border-black bg-[#F5F2ED]"
                  >
                    <summary className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:p-8 cursor-pointer hover:bg-black/5 select-none transition-colors">
                      <div>
                        <p className="font-mono text-[10px] opacity-50 tracking-widest uppercase mb-1">
                          ID: {group.id.slice(0, 8)}
                        </p>
                        <h3 className="font-black text-xl uppercase tracking-tighter group-open/item:text-primary transition-colors">
                          {group.name.ka}
                        </h3>
                        <p className="font-mono text-[10px] mt-1 opacity-70 tracking-widest uppercase">
                          {categoryCount} LINKED_CATEGORIES
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-[10px] tracking-widest uppercase border-2 border-black bg-white px-3 py-1">
                          INDEX #{group.order}
                        </div>
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-black border-2 border-black px-4 py-2 bg-white group-open/item:bg-black group-open/item:text-white transition-colors">
                           EDIT_GROUP
                        </p>
                      </div>
                    </summary>

                    <form action={updateGroupAction} className="space-y-6 p-6 lg:p-8 border-t-2 border-black bg-white cursor-default">
                      <input type="hidden" name="id" value={group.id} />

                      <div className="grid gap-6 md:grid-cols-2">
                        <label className="block">
                          <span className={labelClass}>დასახელება GE / LABEL GE</span>
                          <input
                            name="nameKa"
                            required
                            defaultValue={group.name.ka}
                            className={inputClass}
                          />
                        </label>

                        <label className="block">
                          <span className={labelClass}>დასახელება EN / LABEL EN</span>
                          <input
                            name="nameEn"
                            defaultValue={group.name.en ?? ""}
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                        <label className="block">
                          <span className={labelClass}>მიმდევრობა / INDEX</span>
                          <input
                            type="number"
                            min={1}
                            name="order"
                            required
                            defaultValue={group.order}
                            className={inputClass}
                          />
                        </label>

                        <label className="flex items-center gap-3 h-full cursor-pointer md:mt-6">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={group.isActive}
                            className={checkboxClass}
                          />
                          <span className="font-mono text-[11px] tracking-widest uppercase shrink-0">აქტიური ჯგუფი / IS_ACTIVE</span>
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
                          formAction={deleteGroupAction}
                          className="border-2 border-black px-8 py-3 font-mono text-[11px] font-bold tracking-widest hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a] transition-all uppercase text-[#ba1a1a]"
                        >
                          REMOVE / წაშლა
                        </button>
                      </div>
                    </form>
                  </details>
                );
              })
            ) : (
              <div className="border-2 border-dashed border-black/30 bg-[#F5F2ED] p-8 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                  EMPTY_MANIFEST / ჯგუფები არ მოიძებნა
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </details>
  );
}
