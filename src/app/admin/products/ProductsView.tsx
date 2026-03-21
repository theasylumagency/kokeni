"use client";

import { useState } from "react";
import type { Group, Category, Product } from "@/lib/catalog/types";
import { createProductAction, updateProductAction, deleteProductAction, toggleProductPublishedAction } from "@/app/admin/actions";
import SlideOver from "@/components/admin/ui/SlideOver";
import AdvancedImageUploader from "@/components/admin/AdvancedImageUploader";
import Image from "next/image";

type ProductsViewProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
  notice: { type: "error" | "success"; message: string } | null;
};

export default function ProductsView({ groups, categories, products, notice }: ProductsViewProps) {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openCreate = () => {
    setEditingProduct(null);
    setIsSlideOverOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsSlideOverOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your catalog items.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={categories.length === 0}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Product
        </button>
      </div>

      {notice && (
        <div className={`rounded-md p-4 text-sm font-medium ${notice.type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-500" : "bg-green-50 text-green-800 border-l-4 border-green-500"}`}>
          {notice.message}
        </div>
      )}

      {categories.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to create a Category before you can add products.
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name (GE)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const firstImage = product.images[0]?.src;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        {firstImage ? (
                          <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            <Image src={firstImage} alt={product.name.ka} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                            <span className="material-symbols-outlined text-gray-400 text-sm">image_not_supported</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px] truncate">{product.name.ka}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{category?.name.ka || "Unknown"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {product.price.mode === "contact" ? "Contact Us" : `${product.price.amount} ₾`}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <form action={async () => {
                          await toggleProductPublishedAction(product.id, !product.isPublished);
                        }}>
                          <button
                            type="submit"
                            title={product.isPublished ? 'Published. Click to make Draft.' : 'Draft. Click to Publish.'}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${product.isPublished ? 'bg-green-500' : 'bg-gray-200'}`}
                            role="switch"
                            aria-checked={product.isPublished}
                          >
                            <span className="sr-only">Toggle published status</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.isPublished ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                        </form>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => openEdit(product)} className="text-blue-600 hover:text-blue-900 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
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
        title={editingProduct ? "Edit Product" : "Create Product"}
        description={editingProduct ? "Modify existing product details." : "Add a new product to your catalog."}
        size="xl"
      >
        <form action={editingProduct ? updateProductAction : createProductAction} className="space-y-8 pb-10">
          {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                required
                defaultValue={editingProduct?.categoryId ?? (categories[0]?.id || "")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                {groups.map((group) => {
                  const groupCategories = categories.filter(c => c.groupId === group.id);
                  if (groupCategories.length === 0) return null;
                  return (
                    <optgroup key={group.id} label={group.name.ka}>
                      {groupCategories.map(category => (
                        <option key={category.id} value={category.id}>{category.name.ka}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name (Georgian)</label>
              <input
                type="text"
                name="nameKa"
                required
                defaultValue={editingProduct?.name.ka ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name (English)</label>
              <input
                type="text"
                name="nameEn"
                defaultValue={editingProduct?.name.en ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Description (Georgian)</label>
                <textarea
                  name="shortDescriptionKa"
                  required
                  rows={2}
                  defaultValue={editingProduct?.shortDescription.ka ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Description (English)</label>
                <textarea
                  name="shortDescriptionEn"
                  rows={2}
                  defaultValue={editingProduct?.shortDescription.en ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Description (Georgian)</label>
                <textarea
                  name="longDescriptionKa"
                  rows={4}
                  defaultValue={editingProduct?.longDescription?.ka ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Description (English)</label>
                <textarea
                  name="longDescriptionEn"
                  rows={4}
                  defaultValue={editingProduct?.longDescription?.en ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  name="priceMode"
                  defaultValue={editingProduct?.price.mode ?? "contact"}
                  className="block w-full sm:w-1/2 rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="contact">Contact Us</option>
                  <option value="fixed">Fixed Price</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="priceAmount"
                  placeholder="Price (₾)"
                  defaultValue={editingProduct?.price.mode === "fixed" ? editingProduct.price.amount : ""}
                  className="block w-full sm:w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {editingProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Index</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="order"
                  required
                  defaultValue={editingProduct.order}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
            
            <div className="flex items-center self-end h-9">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                defaultChecked={editingProduct ? editingProduct.isPublished : true}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                Published (Visible to customers)
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">Product Images</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <AdvancedImageUploader existingImages={editingProduct ? editingProduct.images : undefined} />
            </div>
          </div>

          <div className="pt-6 justify-end border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            {editingProduct && (
              <button
                formAction={deleteProductAction}
                className="w-full sm:w-auto flex justify-center py-2 px-6 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Product
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto flex justify-center py-2 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              {editingProduct ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
