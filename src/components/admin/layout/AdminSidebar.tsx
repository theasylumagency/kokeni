"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/groups", label: "Groups", icon: "folder_open" },
    { href: "/admin/categories", label: "Categories", icon: "category" },
    { href: "/admin/products", label: "Products", icon: "inventory_2" },
    { href: "/admin/photo-generation", label: "AI Photos", icon: "photo_camera" },
    { href: "/admin/regeneration", label: "AI Regeneration", icon: "auto_awesome" },
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 z-[60] flex h-16 items-center px-4">
        <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900">
          <span className="material-symbols-outlined block">menu</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[65] bg-gray-800 bg-opacity-50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[70] flex w-64 flex-col bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-bold tracking-tight text-gray-900">Kokeni Admin</span>
          <button className="md:hidden p-2 -mr-4 text-gray-500 hover:text-gray-900 focus:outline-none" onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined block">close</span>
          </button>
        </div>
      <nav className="flex flex-1 flex-col p-4 gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/ka"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">public</span>
          View Site
        </Link>
      </div>
      </aside>
    </>
  );
}
