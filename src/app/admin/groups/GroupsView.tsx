"use client";

import { useState } from "react";
import type { Group, Category } from "@/lib/catalog/types";
import { createGroupAction, updateGroupAction, deleteGroupAction } from "@/app/admin/actions";
import SlideOver from "@/components/admin/ui/SlideOver";

type GroupsViewProps = {
  groups: Group[];
  categories: Category[];
  notice: { type: "error" | "success"; message: string } | null;
};

export default function GroupsView({ groups, categories, notice }: GroupsViewProps) {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const openCreate = () => {
    setEditingGroup(null);
    setIsSlideOverOpen(true);
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setIsSlideOverOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500">Manage master product groups.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          Add Group
        </button>
      </div>

      {notice && (
        <div className={`rounded-md p-4 text-sm font-medium ${notice.type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-500" : "bg-green-50 text-green-800 border-l-4 border-green-500"}`}>
          {notice.message}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name (GE)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name (EN)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No groups found. Try creating one.
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const groupCategories = categories.filter(c => c.groupId === group.id).length;
                  return (
                    <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{group.name.ka}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{group.name.en || "-"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{group.order}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{groupCategories}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => openEdit(group)} className="text-blue-600 hover:text-blue-900 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
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
        title={editingGroup ? "Edit Group" : "Create Group"}
        description={editingGroup ? "Modify the properties of this group." : "Add a new master group to the catalog."}
      >
        <form action={editingGroup ? updateGroupAction : createGroupAction} className="space-y-6">
          {editingGroup && <input type="hidden" name="id" value={editingGroup.id} />}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name (Georgian)</label>
            <input
              type="text"
              name="nameKa"
              required
              defaultValue={editingGroup?.name.ka ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. მთავარი კერძები"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name (English)</label>
            <input
              type="text"
              name="nameEn"
              defaultValue={editingGroup?.name.en ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Main Dishes"
            />
          </div>

          {editingGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Index</label>
              <input
                type="number"
                min="1"
                step="1"
                name="order"
                required
                defaultValue={editingGroup.order}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={editingGroup ? editingGroup.isActive : true}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (Visible in catalog)
            </label>
          </div>

          <div className="pt-6 border-t border-gray-200 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              {editingGroup ? "Save Changes" : "Create Group"}
            </button>

            {editingGroup && (
              <button
                formAction={deleteGroupAction}
                className="w-full flex justify-center py-2 px-4 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Group
              </button>
            )}
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
