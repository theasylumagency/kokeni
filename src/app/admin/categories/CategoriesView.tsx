"use client";

import { useState } from "react";
import type { Group, Category, Product } from "@/lib/catalog/types";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/app/admin/actions";
import SlideOver from "@/components/admin/ui/SlideOver";

type CategoriesViewProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
  notice: { type: "error" | "success"; message: string } | null;
};

export default function CategoriesView({ groups, categories, products, notice }: CategoriesViewProps) {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setIsSlideOverOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setIsSlideOverOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage catalog categories.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={groups.length === 0}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Category
        </button>
      </div>

      {notice && (
        <div className={`rounded-md p-4 text-sm font-medium ${notice.type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-500" : "bg-green-50 text-green-800 border-l-4 border-green-500"}`}>
          {notice.message}
        </div>
      )}

      {groups.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to create a Master Group before you can create categories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category (GE)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category (EN)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No categories found. Try creating one.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const parentGroup = groups.find(g => g.id === category.groupId);
                  const categoryProducts = products.filter(p => p.categoryId === category.id).length;
                  return (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {parentGroup ? parentGroup.name.ka : "Unknown"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{category.name.ka}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{category.name.en || "-"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {category.showOnHome ? (
                          <span className="text-green-600 material-symbols-outlined text-[18px]">home</span>
                        ) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{categoryProducts}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => openEdit(category)} className="text-blue-600 hover:text-blue-900 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description={editingCategory ? "Modify the properties of this category." : "Add a new category to a group."}
      >
        <form action={editingCategory ? updateCategoryAction : createCategoryAction} className="space-y-6">
          {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Group</label>
            <select
              name="groupId"
              required
              defaultValue={editingCategory?.groupId ?? (groups[0]?.id || "")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name.ka}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name (Georgian)</label>
            <input
              type="text"
              name="nameKa"
              required
              defaultValue={editingCategory?.name.ka ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. ცხელი კერძები"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name (English)</label>
            <input
              type="text"
              name="nameEn"
              defaultValue={editingCategory?.name.en ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Hot Dishes"
            />
          </div>

          {editingCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Index</label>
              <input
                type="number"
                min="1"
                step="1"
                name="order"
                required
                defaultValue={editingCategory.order}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={editingCategory ? editingCategory.isActive : true}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (Visible in catalog)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showOnHome"
                name="showOnHome"
                defaultChecked={editingCategory?.showOnHome ?? false}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showOnHome" className="ml-2 block text-sm text-gray-900">
                Show on Home Page
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </button>

            {editingCategory && (
              <button
                formAction={deleteCategoryAction}
                className="w-full flex justify-center py-2 px-4 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Category
              </button>
            )}
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
