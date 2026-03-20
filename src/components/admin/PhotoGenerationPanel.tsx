"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useFormStatus } from "react-dom";

import { createPhotoProductAction } from "@/app/admin/actions";
import {
  buildSuggestedPhotoProductName,
  REQUIRED_PHOTO_KINDS,
} from "@/lib/catalog/photoProduct";
import type {
  Category,
  Group,
  Product,
  ProductPhotoKind,
} from "@/lib/catalog/types";

type PhotoGenerationPanelProps = {
  groups: Group[];
  categories: Category[];
  products: Product[];
};

type SlotImageMap = Record<ProductPhotoKind, string | null>;
type SlotFileMap = Record<ProductPhotoKind, File | null>;

type PhotoSlotDefinition = {
  key: ProductPhotoKind;
  title: string;
  hint: string;
};

const photoSlots: PhotoSlotDefinition[] = [
  {
    key: "front_closed",
    title: "წინა მხარე დახურულ მდგომარეობაში",
    hint: "გარე ყდა გადაიღეთ პირდაპირი ხედით.",
  },
  {
    key: "interior_open",
    title: "შიდა ნაწილი გახსნილ მდგომარეობაში",
    hint: "გადაშლილი შიგთავსი კადრში სრულად უნდა ჩანდეს.",
  },
  {
    key: "detail_spine",
    title: "ზურგის ახლო დეტალი",
    hint: "აჩვენეთ მასალა, ფაქტურა და დამუშავების ხარისხი.",
  },
];

const initialSlotImages: SlotImageMap = {
  front_closed: null,
  interior_open: null,
  detail_spine: null,
};

const initialSlotFiles: SlotFileMap = {
  front_closed: null,
  interior_open: null,
  detail_spine: null,
};

const panelClass = "border-2 border-black bg-white";
const inputClass =
  "w-full rounded-none border-2 border-black bg-[#F5F2ED] px-4 py-4 text-base text-black outline-none transition-colors focus:border-[#0d59f2]";
const labelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60";

export default function PhotoGenerationPanel({
  groups,
  categories,
  products,
}: PhotoGenerationPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [nameKa, setNameKa] = useState("");
  const [hasManualName, setHasManualName] = useState(false);
  const [slotFiles, setSlotFiles] = useState<SlotFileMap>(initialSlotFiles);
  const [slotPreviews, setSlotPreviews] =
    useState<SlotImageMap>(initialSlotImages);
  const [aiImages, setAiImages] = useState<SlotImageMap>(initialSlotImages);
  const [generatingSlot, setGeneratingSlot] = useState<
    ProductPhotoKind | "all" | null
  >(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewRef = useRef<SlotImageMap>(initialSlotImages);

  const visibleCategories = selectedGroupId
    ? categories.filter((category) => category.groupId === selectedGroupId)
    : categories;

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;
  const suggestedName = selectedCategory
    ? buildSuggestedPhotoProductName(selectedCategory, products)
    : "";

  useEffect(() => {
    previewRef.current = slotPreviews;
  }, [slotPreviews]);

  useEffect(() => {
    return () => {
      Object.values(previewRef.current).forEach((preview) => {
        revokeObjectUrlIfNeeded(preview);
      });
    };
  }, []);

  useEffect(() => {
    if (!selectedGroupId || !selectedCategoryId) {
      return;
    }

    const belongsToSelectedGroup = categories.some(
      (category) =>
        category.id === selectedCategoryId && category.groupId === selectedGroupId
    );

    if (!belongsToSelectedGroup) {
      setSelectedCategoryId("");
    }
  }, [categories, selectedCategoryId, selectedGroupId]);

  useEffect(() => {
    if (!hasManualName) {
      setNameKa(suggestedName);
    }
  }, [hasManualName, suggestedName]);

  const imagesJson = JSON.stringify(
    photoSlots.flatMap((slot, index) => {
      const src = aiImages[slot.key];

      if (!src) {
        return [];
      }

      return [
        {
          id: slot.key,
          src,
          order: index + 1,
          kind: slot.key,
        },
      ];
    })
  );

  const allPhotosReady = REQUIRED_PHOTO_KINDS.every((slotKey) => slotFiles[slotKey]);
  const allAiPhotosReady = REQUIRED_PHOTO_KINDS.every(
    (slotKey) => aiImages[slotKey]
  );

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setHasManualName(true);
    setNameKa(event.target.value);
  }

  function handleResetSuggestedName() {
    setHasManualName(false);
    setNameKa(suggestedName);
  }

  function clearRawSlot(slotKey: ProductPhotoKind) {
    setSlotFiles((current) => ({
      ...current,
      [slotKey]: null,
    }));
    setSlotPreviews((current) => {
      revokeObjectUrlIfNeeded(current[slotKey]);
      return {
        ...current,
        [slotKey]: null,
      };
    });
  }

  async function handlePhotoSelection(
    slotKey: ProductPhotoKind,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("გთხოვთ, აირჩიოთ მხოლოდ ფოტო ფაილი.");
      return;
    }

    const nextPreview = URL.createObjectURL(file);

    setUploadError(null);
    setSlotFiles((current) => ({
      ...current,
      [slotKey]: file,
    }));
    setSlotPreviews((current) => {
      revokeObjectUrlIfNeeded(current[slotKey]);
      return {
        ...current,
        [slotKey]: nextPreview,
      };
    });
    setAiImages((current) => ({
      ...current,
      [slotKey]: null,
    }));
  }

  function handleRemovePhoto(slotKey: ProductPhotoKind) {
    clearRawSlot(slotKey);
    setAiImages((current) => ({
      ...current,
      [slotKey]: null,
    }));
  }

  async function handleGenerateAi(slotKey: ProductPhotoKind | "all") {
    setUploadError(null);
    setGeneratingSlot(slotKey);

    try {
      const slotsToGenerate =
        slotKey === "all" ? [...REQUIRED_PHOTO_KINDS] : [slotKey];

      for (const currentSlot of slotsToGenerate) {
        const rawFile = slotFiles[currentSlot];

        if (!rawFile) {
          continue;
        }

        const formData = new FormData();
        formData.append("slotKey", currentSlot);
        formData.append("categoryName", nameKa || suggestedName || "პროდუქტი");
        formData.append("image", rawFile, rawFile.name || `${currentSlot}.jpg`);

        const response = await fetch("/api/admin/generate-photo", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as {
          success?: boolean;
          imageBase64?: string;
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.imageBase64) {
          throw new Error(payload.error || "Generation failed");
        }

        const generatedFile = new File(
          [base64ToBlob(payload.imageBase64, "image/webp")],
          `${currentSlot}-ai.webp`,
          { type: "image/webp" }
        );

        const uploadedAiImage = await uploadPhoto(generatedFile, currentSlot);

        setAiImages((current) => ({
          ...current,
          [currentSlot]: uploadedAiImage,
        }));
        clearRawSlot(currentSlot);
      }
    } catch (error) {
      console.error(error);
      setUploadError("AI გენერაცია ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setGeneratingSlot(null);
    }
  }

  if (!categories.length) {
    return (
      <section className={`${panelClass} p-6 sm:p-8`}>
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight">
            ფოტოებით პროდუქტის შექმნა
          </h2>
          <p className="text-sm leading-6 text-black/70">
            ახალი პროდუქტის შესაქმნელად ჯერ ერთი კატეგორია მაინც უნდა არსებობდეს.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b-2 border-black bg-[#E7E1D8] px-5 py-6 sm:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black/60">
            მობილური სწრაფი ფორმა
          </p>
          <h2 className="text-3xl font-black tracking-tight text-black">
            ფოტოებით პროდუქტის შექმნა
          </h2>
          <p className="text-sm leading-6 text-black/70">
            აირჩიეთ ჯგუფი და კატეგორია, დაადასტურეთ რეკომენდებული დასახელება,
            გადაიღეთ სამი ფოტო, შემდეგ გაუშვით Gemini-ზე გენერაცია. საწყისი
            ფოტოები მხოლოდ დროებით გამოიყენება და არ ინახება პროექტში.
          </p>
        </div>
      </div>

      <form action={createPhotoProductAction} className="space-y-8 p-5 sm:p-8">
        <input type="hidden" name="imagesJson" value={imagesJson} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>ჯგუფი</span>
            <select
              name="groupId"
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              className={inputClass}
            >
              <option value="">ყველა ჯგუფი</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name.ka}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>კატეგორია</span>
            <select
              name="categoryId"
              required
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className={inputClass}
            >
              <option value="">აირჩიეთ კატეგორია</option>
              {selectedGroupId
                ? visibleCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name.ka}
                    </option>
                  ))
                : groups.map((group) => {
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
            {selectedGroupId && !visibleCategories.length ? (
              <span className="mt-2 block text-sm text-[#93000a]">
                ამ ჯგუფში კატეგორიები ჯერ არ არის დამატებული.
              </span>
            ) : null}
          </label>
        </div>

        <div className="rounded-none border-2 border-black bg-[#F5F2ED] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className={labelClass}>პროდუქტის დასახელება</p>
              <p className="text-sm leading-6 text-black/70">
                კატეგორიის არჩევისას ავტომატურად შეიქმნება ფორმატი:
                {" "}
                <span className="font-bold text-black">
                  კატეგორია + სამნიშნა ნომერი
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSuggestedName}
              disabled={!selectedCategory || !suggestedName}
              className="shrink-0 border-2 border-black px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              რეკომენდებულის აღდგენა
            </button>
          </div>

          <label className="mt-5 block">
            <input
              name="nameKa"
              required
              value={nameKa}
              onChange={handleNameChange}
              placeholder="აირჩიეთ კატეგორია"
              className={inputClass}
            />
          </label>

          <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-black/70">
              რეკომენდებული სახელია:
              {" "}
              <span className="font-bold text-black">
                {suggestedName || "ჯერ აირჩიეთ კატეგორია"}
              </span>
            </span>
            <span
              className={`font-bold ${
                hasManualName ? "text-[#7a4f00]" : "text-[#0a5c36]"
              }`}
            >
              {hasManualName
                ? "სახელი ხელით არის შეცვლილი"
                : "სახელი ავტომატურად ახლდება"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className={labelClass}>სავალდებულო ფოტოები</p>
            <p className="text-sm leading-6 text-black/70">
              ცარიელ ფრეიმზე დაჭერისას კამერა პირდაპირ გაიხსნება. გადაღებული
              ფოტო მხოლოდ დროებით გამოიყენება Gemini-სთვის და საბოლოოდ ინახება
              მხოლოდ გენერირებული შედეგი.
            </p>
          </div>

          <div className="grid gap-4">
            {photoSlots.map((slot) => {
              const previewSrc = slotPreviews[slot.key];
              const aiSrc = aiImages[slot.key];
              const isGenerating =
                generatingSlot === slot.key || generatingSlot === "all";

              return (
                <div
                  key={slot.key}
                  className="grid gap-4 border-2 border-black bg-[#F5F2ED] p-4 sm:grid-cols-[160px_160px_minmax(0,1fr)]"
                >
                  <label className="relative block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) =>
                        void handlePhotoSelection(slot.key, event)
                      }
                    />

                    <div className="relative aspect-[4/5] overflow-hidden border-2 border-black bg-white transition-colors hover:border-[#0d59f2]">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={slot.title}
                          className="h-full w-full object-cover"
                        />
                      ) : aiSrc ? (
                        <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-black/35">
                          საწყისი ფოტო გასუფთავებულია
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                          ფოტოს გადასაღებად შეეხეთ
                        </div>
                      )}

                      {previewSrc ? (
                        <button
                          type="button"
                          aria-label="ფოტოს წაშლა"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleRemovePhoto(slot.key);
                          }}
                          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[3px_3px_0_#000] transition-colors hover:bg-[#ba1a1a] hover:text-white"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                          >
                            delete
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </label>

                  <div className="relative aspect-[4/5] overflow-hidden border-2 border-black bg-white">
                    {aiSrc ? (
                      <img
                        src={aiSrc}
                        alt={`AI ${slot.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                        {isGenerating ? (
                          <span className="text-[#0d59f2]">გენერაცია...</span>
                        ) : (
                          <span>AI ფოტო</span>
                        )}
                      </div>
                    )}

                    {aiSrc ? (
                      <button
                        type="button"
                        aria-label="AI ფოტოს წაშლა"
                        onClick={() =>
                          setAiImages((current) => ({
                            ...current,
                            [slot.key]: null,
                          }))
                        }
                        className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-black shadow-[3px_3px_0_#000] transition-colors hover:bg-[#ba1a1a] hover:text-white"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "20px" }}
                        >
                          delete
                        </span>
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black tracking-tight text-black">
                          {slot.title}
                        </h3>
                        <span
                          className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            aiSrc
                              ? "border-[#0a5c36] bg-[#daf2e6] text-[#0a5c36]"
                              : previewSrc
                                ? "border-[#7a4f00] bg-[#fff1cc] text-[#7a4f00]"
                                : "border-[#93000a] bg-[#ffdad6] text-[#93000a]"
                          }`}
                        >
                          {aiSrc
                            ? "გენერირებულია"
                            : previewSrc
                              ? "მზადაა გენერაციისთვის"
                              : "სავალდებულოა"}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-black/70">{slot.hint}</p>
                    </div>

                    <div className="space-y-3">
                      {previewSrc ? (
                        <button
                          type="button"
                          onClick={() => handleGenerateAi(slot.key)}
                          disabled={generatingSlot !== null}
                          className="w-full border-2 border-black bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isGenerating
                            ? "მიმდინარეობს გენერაცია..."
                            : "ამ ფოტოს გენერაცია"}
                        </button>
                      ) : null}

                      {aiSrc ? (
                        <p className="text-sm font-bold text-black/65">
                          საბოლოო AI ფოტო შენახულია. თუ შეცვლა გინდათ, თავიდან
                          გადაიღეთ საწყისი ფოტო.
                        </p>
                      ) : previewSrc ? (
                        <p className="text-sm font-bold text-black/65">
                          საწყისი ფოტო დროებით ინახება მხოლოდ Gemini-სთვის.
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-black/65">
                          ცარიელ ფრეიმზე დაჭერით კამერა გაიხსნება.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {uploadError ? (
            <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
              {uploadError}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t-2 border-black pt-6">
          {allPhotosReady && !allAiPhotosReady ? (
            <button
              type="button"
              onClick={() => handleGenerateAi("all")}
              disabled={generatingSlot !== null}
              className="w-full border-2 border-black bg-white px-6 py-5 text-center text-sm font-black uppercase tracking-[0.22em] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingSlot === "all"
                ? "მიმდინარეობს გენერაცია..."
                : "ყველა ფოტოს AI-ით გენერაცია"}
            </button>
          ) : null}

          <p className="text-sm leading-6 text-black/70">
            პროდუქტი შეიქმნება როგორც დრაფტი. თუ საჯაროდ გამოქვეყნება დაგჭირდებათ,
            შემდეგ შეგიძლიათ პროდუქტების სექციაში გახსნათ და დაარედაქტიროთ.
          </p>

          <SubmitButton
            disabled={
              !selectedCategoryId ||
              !nameKa.trim() ||
              !allAiPhotosReady ||
              generatingSlot !== null
            }
          />
        </div>
      </form>
    </section>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full border-2 border-black bg-[#0d59f2] px-6 py-5 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-black/30"
    >
      {pending ? "ინახება..." : "ახალი პროდუქტის შექმნა"}
    </button>
  );
}

async function uploadPhoto(
  file: File,
  slotKey: ProductPhotoKind
): Promise<string> {
  const formData = new FormData();
  formData.append("file1600", file, file.name || `${slotKey}.jpg`);

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    image?: string;
  };

  if (!response.ok || !payload.success || !payload.image) {
    throw new Error("Upload failed");
  }

  return payload.image;
}

function revokeObjectUrlIfNeeded(value: string | null) {
  if (value?.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}
