"use client";

import { useState } from "react";
import { type Product, type ProductImage, type ProductPhotoKind, type Category, type Group } from "@/lib/catalog/types";
import { updateProductPhotosAction } from "@/app/admin/actions";
import { REQUIRED_PHOTO_KINDS } from "@/lib/catalog/photoProduct";

type RegenerationPanelProps = {
  products: Product[];
  categories: Category[];
  groups: Group[];
};

type GeneratedImagePayload = {
  base64: string;
  mimeType: string;
};

type SlotImageMap = Record<ProductPhotoKind, string | null>;

const photoSlots: { key: ProductPhotoKind; title: string }[] = [
  { key: "front_closed", title: "წინა მხარე დახურული" },
  { key: "interior_open", title: "შიდა ნაწილი გახსნილი" },
  { key: "detail_spine", title: "ზურგის ახლო დეტალი" },
];

const PRESET_STYLES = [
  { label: "Minimal Light Studio", prompt: "clean minimal light-grey or warm-white studio background with soft diffused lighting, highlighting the premium stationery texture" },
  { label: "Dark Moody Desktop", prompt: "dark moody premium desktop environment with warm task lighting, dark wood desk, luxury stationery aesthetic" },
  { label: "Natural Sunlight", prompt: "bright natural sunlight with soft angled shadows on light concrete or stone, fresh natural premium vibe" },
];

export default function RegenerationPanel({ products, categories, groups }: RegenerationPanelProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [stylePrompt, setStylePrompt] = useState(PRESET_STYLES[0].prompt);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [newImages, setNewImages] = useState<SlotImageMap>({
    front_closed: null,
    interior_open: null,
    detail_spine: null,
  });
  const [selectedToKeep, setSelectedToKeep] = useState<Record<ProductPhotoKind, "old" | "new">>({
    front_closed: "new",
    interior_open: "new",
    detail_spine: "new",
  });
  
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;
  const category = selectedProduct ? categories.find(c => c.id === selectedProduct.categoryId) : null;

  async function handleRegenerate() {
    if (!selectedProduct || !category || !selectedProduct.originalImages) return;

    setIsGenerating(true);
    setPanelError(null);
    setPanelMessage("მიმდინარეობს ახალი ფოტოების გენერაცია...");
    setNewImages({ front_closed: null, interior_open: null, detail_spine: null });

    try {
      // Build the JSON to send to our new API route
      const referencePaths: Record<string, string> = {};
      selectedProduct.originalImages.forEach((img) => {
        if (img.kind) {
          referencePaths[img.kind] = img.src;
        }
      });

      const response = await fetch("/api/admin/regenerate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName: category.name.en || category.name.ka,
          stylePrompt,
          ...referencePaths
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.images) {
        throw new Error(payload.error || "Generation failed");
      }

      setPanelMessage("გენერაცია დასრულდა. მიმდინარეობს სერვერზე შენახვა...");

      const uploadedSlotImages: SlotImageMap = { front_closed: null, interior_open: null, detail_spine: null };

      for (const slotKey of REQUIRED_PHOTO_KINDS) {
        const generatedImage = payload.images[slotKey];
        if (!generatedImage) throw new Error(`Missing generated image for ${slotKey}`);

        const uploadedUrl = await uploadGeneratedPhoto(slotKey, generatedImage);
        uploadedSlotImages[slotKey] = uploadedUrl;
      }

      setNewImages(uploadedSlotImages);
      setSelectedToKeep({ front_closed: "new", interior_open: "new", detail_spine: "new" });
      setPanelMessage("გენერაცია წარმატებით დასრულდა. შეგიძლიათ აირჩიოთ რომელი ფოტოები შეინახოთ.");
    } catch (error) {
      console.error(error);
      setPanelError("გენერაცია ან სერვერზე შენახვა ვერ დასრულდა.");
      setPanelMessage(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveSelection() {
    if (!selectedProduct) return;
    
    setIsGenerating(true);
    setPanelError(null);
    setPanelMessage("ინახება ცვლილებები...");

    try {
      // Combine old images that were kept, with new images that were kept
      const finalImages: ProductImage[] = [];

      REQUIRE_PHOTO_KINDS_ORDERED.forEach((slotKey, index) => {
        const choice = selectedToKeep[slotKey];
        let src = "";
        
        if (choice === "new" && newImages[slotKey]) {
          src = newImages[slotKey]!;
        } else {
          const oldImage = selectedProduct.images.find(i => i.kind === slotKey);
          if (oldImage) src = oldImage.src;
        }

        if (src) {
          finalImages.push({
            id: slotKey,
            src,
            order: index + 1,
            kind: slotKey
          });
        }
      });

      await updateProductPhotosAction(selectedProduct.id, JSON.stringify(finalImages));
      setPanelMessage("ფოტოები წარმატებით განახლდა.");
      setNewImages({ front_closed: null, interior_open: null, detail_spine: null });
    } catch (error) {
      console.error(error);
      setPanelError("პროდუქტის განახლება ვერ მოხერხდა.");
      setPanelMessage(null);
    } finally {
      setIsGenerating(false);
    }
  }

  const REQUIRE_PHOTO_KINDS_ORDERED = REQUIRED_PHOTO_KINDS;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b-2 border-black bg-[#E7E1D8] px-5 py-6 sm:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black/60">
            PHOTO REGENERATION
          </p>
          <h2 className="text-3xl font-black tracking-tight text-black">
            AI ფოტოების განახლება
          </h2>
          <p className="text-sm leading-6 text-black/70">
            აირჩიეთ პროდუქტი, რომელსაც უკვე აქვს შენახული ორიგინალი ფოტოები. შეგიძლიათ ახალი სტილით 
            დააგენერიროთ ახალი ფოტოები და ჩაანაცვლოთ არსებული.
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">პროდუქტის არჩევა</label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setNewImages({ front_closed: null, interior_open: null, detail_spine: null });
              setPanelError(null);
              setPanelMessage(null);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="">აირჩიეთ პროდუქტი</option>
            {products.map((p) => {
              const kaName = p.name.ka;
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <option key={p.id} value={p.id}>
                  {cat ? `[${cat.name.ka}] ` : ""}{kaName}
                </option>
              );
            })}
          </select>
        </div>

        {selectedProduct && (
          <>
            <div className="rounded-none border-2 border-black bg-[#F5F2ED] p-5">
              <label className="block text-sm font-bold text-gray-900 mb-2">Prompt Style Override</label>
              <textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:outline-none sm:text-sm"
              />
              
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {PRESET_STYLES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setStylePrompt(preset.prompt)}
                    className="border border-black/20 bg-white px-3 py-1 hover:bg-black/5"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-black pt-6">
              <h3 className="text-lg font-black tracking-tight mb-4">Original Reference Photos</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {photoSlots.map(slot => {
                  const origImg = selectedProduct.originalImages?.find(i => i.kind === slot.key);
                  return (
                    <div key={`orig-${slot.key}`} className="border-2 border-black bg-gray-100 relative pt-8 p-2">
                       <span className="absolute top-0 left-0 bg-black text-white text-[10px] px-2 py-1 font-bold">{slot.title}</span>
                       <div className="aspect-[4/5] relative bg-white border border-gray-300">
                          {origImg ? <img src={origImg.src} className="w-full h-full object-cover" alt="" /> : <p className="text-center p-4">N/A</p>}
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="w-full border-2 border-black bg-black px-6 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-[#0d59f2] disabled:opacity-50"
            >
              {isGenerating && !newImages.front_closed ? "მიმდინარეობს გენერაცია..." : "ახალი ფოტოების გენერაცია"}
            </button>

            {panelMessage && <div className="border-2 border-black bg-[#dce1ff] px-4 py-3 text-sm font-bold text-black">{panelMessage}</div>}
            {panelError && <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-sm font-bold text-[#93000a]">{panelError}</div>}

            {(newImages.front_closed || newImages.interior_open || newImages.detail_spine) && (
              <div className="border-t-2 border-black pt-6 space-y-6">
                <h3 className="text-lg font-black tracking-tight">Select Photos To Keep</h3>
                <div className="space-y-6">
                  {photoSlots.map(slot => {
                    const oldImg = selectedProduct.images.find(i => i.kind === slot.key);
                    const newImgSrc = newImages[slot.key];

                    return (
                      <div key={`select-${slot.key}`} className="border border-gray-300 p-4">
                        <h4 className="font-bold mb-3">{slot.title}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`block border-2 cursor-pointer p-2 ${selectedToKeep[slot.key] === "old" ? "border-blue-600 bg-blue-50" : "border-transparent"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <input 
                                type="radio" 
                                name={`keep-${slot.key}`} 
                                checked={selectedToKeep[slot.key] === "old"}
                                onChange={() => setSelectedToKeep(c => ({...c, [slot.key]: "old"}))}
                              />
                              <span className="font-bold text-sm text-gray-600">არსებული ფოტო</span>
                            </div>
                            <div className="aspect-[4/5] relative bg-gray-100">
                               {oldImg && <img src={oldImg.src} className="w-full h-full object-cover" alt="" />}
                            </div>
                          </label>

                          <label className={`block border-2 cursor-pointer p-2 ${selectedToKeep[slot.key] === "new" ? "border-blue-600 bg-blue-50" : "border-transparent"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <input 
                                type="radio" 
                                name={`keep-${slot.key}`} 
                                checked={selectedToKeep[slot.key] === "new"}
                                onChange={() => setSelectedToKeep(c => ({...c, [slot.key]: "new"}))}
                              />
                              <span className="font-bold text-sm text-blue-600">ახალი ფოტო</span>
                            </div>
                            <div className="aspect-[4/5] relative bg-gray-100">
                               {newImgSrc && <img src={newImgSrc} className="w-full h-full object-cover" alt="" />}
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSaveSelection}
                  disabled={isGenerating}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0a5c36] hover:bg-[#074226] disabled:opacity-50"
                >
                  მონიშნული ფოტოების შენახვა
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm p-6 text-center transition-all duration-300">
          <span className="material-symbols-outlined animate-spin text-[64px] text-blue-600 mb-6">sync</span>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">Processing...</h2>
          <p className="text-sm leading-6 text-gray-600 max-w-sm">Please wait while the AI generates and uploads your images.</p>
        </div>
      )}
    </section>
  );
}

async function uploadGeneratedPhoto(slotKey: ProductPhotoKind, generatedImage: GeneratedImagePayload): Promise<string> {
  const imageFiles = await buildGeneratedImageFiles(slotKey, generatedImage);

  const formData = new FormData();
  formData.append("file1600", imageFiles.file1600, imageFiles.file1600.name);
  formData.append("file800", imageFiles.file800, imageFiles.file800.name);

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success || !payload.image) throw new Error(`Upload failed for ${slotKey}`);

  return payload.image;
}

async function buildGeneratedImageFiles(slotKey: ProductPhotoKind, generatedImage: GeneratedImagePayload): Promise<{ file1600: File; file800: File }> {
  const sourceBlob = base64ToBlob(generatedImage.base64, generatedImage.mimeType);
  const objectUrl = URL.createObjectURL(sourceBlob);
  let image: HTMLImageElement | null = new window.Image();

  try {
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
       if (!image) { reject(new Error("Image element missing")); return; }
       image.onload = () => resolve();
       image.onerror = () => reject(new Error("Image load failed"));
    });

    const blob1600 = await renderImageToWebp(image, 1600);
    const blob800 = await renderImageToWebp(image, 800);

    return {
       file1600: new File([blob1600], `${slotKey}-1600.webp`, { type: "image/webp" }),
       file800: new File([blob800], `${slotKey}-800.webp`, { type: "image/webp" }),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
    if (image) {
       image.onload = null;
       image.onerror = null;
       image.src = "";
       image = null;
    }
  }
}

async function renderImageToWebp(image: HTMLImageElement, size: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is not available");
  context.drawImage(image, 0, 0, size, size);

  try {
    return await canvasToBlob(canvas, "image/webp", 0.9);
  } finally {
    context.clearRect(0, 0, size, size);
    canvas.width = 0;
    canvas.height = 0;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
       if (!blob) { reject(new Error("Canvas produced an empty blob")); return; }
       resolve(blob);
    }, mimeType, quality);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}
