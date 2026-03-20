"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
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

type SlotFileMap = Record<ProductPhotoKind, File | null>;
type SlotImageMap = Record<ProductPhotoKind, string | null>;

type GeneratedImagePayload = {
  base64: string;
  mimeType: string;
};

type GeneratedImagesResponse = Record<ProductPhotoKind, GeneratedImagePayload>;

type PhotoSlotDefinition = {
  key: ProductPhotoKind;
  title: string;
  hint: string;
};

const photoSlots: PhotoSlotDefinition[] = [
  {
    key: "front_closed",
    title: "წინა მხარე დახურული",
    hint: "გარე ყდა გადაიღეთ პირდაპირი ხედით, სრული ფორმა მკაფიოდ უნდა ჩანდეს.",
  },
  {
    key: "interior_open",
    title: "შიდა ნაწილი გახსნილი",
    hint: "გადაშლილი შიგთავსი სრულად უნდა ჩანდეს, გვერდები და კონსტრუქცია არ მოიჭრას.",
  },
  {
    key: "detail_spine",
    title: "ზურგის ახლო დეტალი",
    hint: "მიუახლოვდით მასალას და ნაკერს, რომ ფაქტურა და დამუშავება კარგად გამოჩნდეს.",
  },
];

const panelClass = "border-2 border-black bg-white";
const inputClass =
  "w-full rounded-none border-2 border-black bg-[#F5F2ED] px-4 py-4 text-base text-black outline-none transition-colors focus:border-[#0d59f2]";
const labelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/60";

function createEmptyRawFiles(): SlotFileMap {
  return {
    front_closed: null,
    interior_open: null,
    detail_spine: null,
  };
}

function createEmptyAiImages(): SlotImageMap {
  return {
    front_closed: null,
    interior_open: null,
    detail_spine: null,
  };
}

function createEmptyInputRefMap(): Record<ProductPhotoKind, HTMLInputElement | null> {
  return {
    front_closed: null,
    interior_open: null,
    detail_spine: null,
  };
}

export default function PhotoGenerationPanel({
  groups,
  categories,
  products,
}: PhotoGenerationPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [nameKa, setNameKa] = useState("");
  const [hasManualName, setHasManualName] = useState(false);
  const [rawFiles, setRawFiles] = useState<SlotFileMap>(() => createEmptyRawFiles());
  const [aiImages, setAiImages] = useState<SlotImageMap>(() => createEmptyAiImages());
  const [cameraSlot, setCameraSlot] = useState<ProductPhotoKind | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingSlot, setIsGeneratingSlot] = useState<ProductPhotoKind | null>(null);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const isGeneratingAny = isGeneratingAll || isGeneratingSlot !== null;

  const rawFileUrls = useRef<Record<ProductPhotoKind, string | null>>({
    front_closed: null,
    interior_open: null,
    detail_spine: null,
  });

  useEffect(() => {
    return () => {
      Object.values(rawFileUrls.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const galleryInputRefs = useRef<Record<ProductPhotoKind, HTMLInputElement | null>>(
    createEmptyInputRefMap()
  );

  const visibleCategories = selectedGroupId
    ? categories.filter((category) => category.groupId === selectedGroupId)
    : categories;

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;
  const suggestedName = selectedCategory
    ? buildSuggestedPhotoProductName(selectedCategory, products)
    : "";

  const hasAllRawPhotos = REQUIRED_PHOTO_KINDS.every((slotKey) => rawFiles[slotKey]);
  const hasAllAiPhotos = REQUIRED_PHOTO_KINDS.every((slotKey) => aiImages[slotKey]);

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

  useEffect(() => {
    if (!cameraStream || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    videoElement.srcObject = cameraStream;

    void videoElement
      .play()
      .then(() => {
        setCameraLoading(false);
        setCameraReady(true);
      })
      .catch((error) => {
        console.error("Failed to start camera preview:", error);
        setCameraLoading(false);
        setCameraReady(false);
        setCameraError(
          "კამერის ჩართვა ვერ მოხერხდა. შეგიძლიათ გალერეიდან აირჩიოთ ფოტო."
        );
      });

    return () => {
      videoElement.pause();
      videoElement.srcObject = null;
      stopMediaStream(cameraStream);
    };
  }, [cameraStream]);

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

  function clearGeneratedImages() {
    setAiImages(createEmptyAiImages());
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setHasManualName(true);
    setNameKa(event.target.value);
  }

  function handleResetSuggestedName() {
    setHasManualName(false);
    setNameKa(suggestedName);
  }

  function setRawFile(slotKey: ProductPhotoKind, file: File | null) {
    if (rawFileUrls.current[slotKey]) {
      URL.revokeObjectURL(rawFileUrls.current[slotKey]!);
    }
    rawFileUrls.current[slotKey] = file ? URL.createObjectURL(file) : null;

    setRawFiles((current) => ({
      ...current,
      [slotKey]: file,
    }));
    setPanelError(null);
    setPanelMessage(
      file
        ? "სამივე ხედის მიღების შემდეგ დააჭირეთ Gemini-ის გენერაციას."
        : "რეფერენს ფოტო წაიშალა."
    );
  }

  async function openCamera(slotKey: ProductPhotoKind) {
    if (isGeneratingAny) {
      return;
    }

    closeCamera();
    setCameraSlot(slotKey);
    setCameraLoading(true);
    setCameraReady(false);
    setCameraError(null);
    setPanelError(null);
    setPanelMessage(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not available");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      setCameraStream(stream);
    } catch (error) {
      console.error("Failed to open camera:", error);
      setCameraLoading(false);
      setCameraReady(false);
      setCameraStream(null);
      setCameraError(
        "კამერის გახსნა ვერ მოხერხდა. შეგიძლიათ ამ ხედისთვის გალერეიდან აირჩიოთ ფოტო."
      );
    }
  }

  function closeCamera() {
    if (cameraStream) {
      stopMediaStream(cameraStream);
    }

    setCameraStream(null);
    setCameraSlot(null);
    setCameraLoading(false);
    setCameraReady(false);
    setCameraError(null);
  }

  async function capturePhoto() {
    if (!cameraSlot || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    const sourceWidth = videoElement.videoWidth;
    const sourceHeight = videoElement.videoHeight;

    if (!sourceWidth || !sourceHeight) {
      setCameraError("კამერიდან კადრის აღება ვერ მოხერხდა. სცადეთ თავიდან.");
      return;
    }

    const { width, height } = fitWithinBounds(sourceWidth, sourceHeight, 1280);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("კადრის დამუშავება ვერ მოხერხდა. სცადეთ თავიდან.");
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    try {
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
      const capturedFile = new File([blob], `${cameraSlot}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      setRawFile(cameraSlot, capturedFile);
      closeCamera();
    } catch (error) {
      console.error("Failed to capture photo:", error);
      setCameraError("კადრის შენახვა ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      context.clearRect(0, 0, width, height);
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  function openGallery(slotKey: ProductPhotoKind) {
    galleryInputRefs.current[slotKey]?.click();
  }

  function handleGallerySelection(
    slotKey: ProductPhotoKind,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPanelError("გთხოვთ აირჩიოთ მხოლოდ ფოტო ფაილი.");
      return;
    }

    setRawFile(slotKey, file);
  }

  function handleRemoveRaw(slotKey: ProductPhotoKind) {
    setRawFile(slotKey, null);
  }

  function handleRemoveAi(slotKey: ProductPhotoKind) {
    setAiImages((current) => ({
      ...current,
      [slotKey]: null,
    }));
    setPanelMessage(
      "AI ფოტო წაიშალა. შეგიძლიათ დააჭიროთ 'ხელახლა გენერაცია'-ს მხოლოდ ამ ხედისთვის, ან თავიდან გაუშვათ სრული გენერაცია."
    );
  }

  async function handleRegenerateSingle(slotKey: ProductPhotoKind) {
    if (!selectedCategory || !hasAllRawPhotos || isGeneratingAny) {
      return;
    }

    setIsGeneratingSlot(slotKey);
    setPanelError(null);
    setPanelMessage("მიმდინარეობს ერთი ხედის ხელახლა გენერაცია...");

    try {
      const response = await requestGeneratedImages(
        selectedCategory.name.en || selectedCategory.name.ka,
        rawFiles,
        slotKey
      );

      const generatedImage = response[slotKey];
      if (!generatedImage) {
        throw new Error(`Missing generated image for ${slotKey}`);
      }

      setPanelMessage("გენერირებული ფოტო ინახება სერვერზე 1600 და 800 ზომებში.");
      const uploadedImage = await uploadGeneratedPhoto(slotKey, generatedImage);

      setAiImages((current) => ({
        ...current,
        [slotKey]: uploadedImage,
      }));

      setPanelMessage(
        `${photoSlots.find((s) => s.key === slotKey)?.title} - ფოტო წარმატებით განახლდა.`
      );
    } catch (error) {
      console.error("Failed to regenerate single product photo:", error);
      setPanelError(
        "ერთეული გენერაცია ან სერვერზე შენახვა ვერ დასრულდა. გთხოვთ სცადოთ თავიდან."
      );
    } finally {
      setIsGeneratingSlot(null);
    }
  }

  async function handleGenerateAll() {
    if (!selectedCategory || !hasAllRawPhotos || isGeneratingAny) {
      return;
    }

    setIsGeneratingAll(true);
    setPanelError(null);
    setPanelMessage("სამივე reference ფოტო იგზავნება Gemini-ზე.");
    setAiImages(createEmptyAiImages());

    try {
      const response = await requestGeneratedImages(
        selectedCategory.name.en || selectedCategory.name.ka,
        rawFiles
      );

      setPanelMessage("გენერირებული ფოტოები ინახება სერვერზე 1600 და 800 ზომებში.");

      for (const slot of photoSlots) {
        const generatedImage = response[slot.key];

        if (!generatedImage) {
          throw new Error(`Missing generated image for ${slot.key}`);
        }

        const uploadedImage = await uploadGeneratedPhoto(slot.key, generatedImage);
        setAiImages((current) => ({
          ...current,
          [slot.key]: uploadedImage,
        }));
      }

      setPanelMessage(
        "სამივე AI ფოტო მზადაა. ახლა შეგიძლიათ ახალი პროდუქტის შექმნა."
      );
    } catch (error) {
      console.error("Failed to generate product photos:", error);
      setPanelError(
        "გენერაცია ან სერვერზე შენახვა ვერ დასრულდა. იგივე სამი ფოტო ისევ სცადეთ."
      );
    } finally {
      setIsGeneratingAll(false);
    }
  }

  function openGalleryFromCameraModal() {
    if (!cameraSlot) {
      return;
    }

    const slotKey = cameraSlot;
    closeCamera();
    window.setTimeout(() => openGallery(slotKey), 0);
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
    <>
      <section className={`${panelClass} overflow-hidden`}>
        <div className="border-b-2 border-black bg-[#E7E1D8] px-5 py-6 sm:px-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black/60">
              მობილური სწრაფი ფორმა
            </p>
            <h2 className="text-3xl font-black tracking-tight text-black">
              ფოტოებით პროდუქტის შექმნა
            </h2>
            <p className="text-sm leading-6 text-black/70">
              გადაიღეთ სამი reference ფოტო, შემდეგ სისტემა სამივეს ერთად გაუგზავნის
              Gemini-ს და სამი სხვადასხვა ხედისთვის შექმნილ შედეგს შეინახავს
              სერვერზე ორ ზომაში: 1600 და 800.
            </p>
          </div>
        </div>

        <form action={createPhotoProductAction} className="space-y-8 p-5 sm:p-8">
          <input type="hidden" name="imagesJson" value={imagesJson} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>ჯგუფი</span>
              <select
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

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight border-b-2 border-black pb-2">
                1. Reference ფოტოები
              </h3>
              <p className="text-sm leading-6 text-black/70">
                გადაიღეთ ან ატვირთეთ პროდუქტის სამი ხედი. ეს ფოტოები გამოიყენება Gemini-სთვის რეფერენსად.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {photoSlots.map((slot) => {
                const rawFile = rawFiles[slot.key];
                const previewUrl = rawFileUrls.current[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="flex flex-col border-2 border-black bg-[#F5F2ED] p-4"
                  >
                    <div className="mb-4 flex flex-1 flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black tracking-tight text-black">
                            {slot.title}
                          </h4>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              rawFile
                                ? "border-[#0a5c36] bg-[#0a5c36] text-white"
                                : "border-black/30"
                            }`}
                          >
                            {rawFile && (
                              <span className="material-symbols-outlined text-[10px]">
                                check
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-xs leading-5 text-black/70">{slot.hint}</p>
                      </div>

                      <div className="pt-2">
                        <input
                          ref={(node) => {
                            galleryInputRefs.current[slot.key] = node;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            handleGallerySelection(slot.key, event)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openGallery(slot.key)}
                          disabled={isGeneratingAny}
                          className="text-xs font-bold text-[#0d59f2] underline underline-offset-4 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          გალერეიდან არჩევა
                        </button>
                      </div>
                    </div>

                    <div className="relative overflow-hidden border-2 border-black bg-white">
                      <div className="aspect-[4/5] w-full">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => void openCamera(slot.key)}
                            disabled={isGeneratingAny}
                            className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-black/50 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[32px]">
                              photo_camera
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                              კამერის ჩართვა
                            </span>
                          </button>
                        )}
                      </div>

                      {previewUrl ? (
                        <button
                          type="button"
                          aria-label="ფოტოს წაშლა"
                          onClick={() => handleRemoveRaw(slot.key)}
                          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ba1a1a] bg-white text-[#ba1a1a] shadow-[2px_2px_0_#ba1a1a] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#ba1a1a]"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            delete
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => void handleGenerateAll()}
                disabled={!selectedCategory || !hasAllRawPhotos || isGeneratingAny}
                className="w-full border-2 border-black bg-black px-6 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#0d59f2] disabled:cursor-not-allowed disabled:bg-black/30"
              >
                {isGeneratingAny && !isGeneratingSlot
                  ? "მიმდინარეობს გენერაცია..."
                  : "სამივე ფოტოს გენერაცია Gemini-ით"}
              </button>
              {!hasAllRawPhotos && (
                <p className="mt-3 text-center text-xs text-black/60">
                  გენერაციის დასაწყებად აუცილებელია სამივე რეფერენს ფოტოს ატვირთვა.
                </p>
              )}
            </div>
          </div>

          {(Object.values(aiImages).some((src) => src !== null) || isGeneratingAny) && (
            <div className="space-y-6 border-t-2 border-black pt-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight border-b-2 border-black pb-2">
                  2. გენერირებული AI ფოტოები
                </h3>
                <p className="text-sm leading-6 text-black/70">
                  ეს არის Gemini-ს მიერ შექმნილი საბოლოო ფოტოები, რომლებიც პროდუქტზე მიებმება. საჭიროების შემთხვევაში დააჭირეთ ერთეულ გენერაციას.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {photoSlots.map((slot) => {
                  const aiSrc = aiImages[slot.key];
                  const isLoadingThis = isGeneratingAll || isGeneratingSlot === slot.key;

                  return (
                    <div key={slot.key} className="space-y-3">
                      <div className="relative overflow-hidden border-2 border-black bg-[#E7E1D8]">
                        <div className="aspect-[4/5] w-full">
                          {aiSrc && !isLoadingThis ? (
                            <img
                              src={aiSrc}
                              alt={slot.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                              {isLoadingThis ? (
                                <>
                                  <span className="material-symbols-outlined animate-spin text-[32px] text-[#0d59f2]">
                                    sync
                                  </span>
                                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0d59f2]">
                                    მუშავდება...
                                  </p>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[32px] text-black/20">
                                    image
                                  </span>
                                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30">
                                    მოლოდინში
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {aiSrc && !isLoadingThis ? (
                          <button
                            type="button"
                            aria-label="AI ფოტოს წაშლა"
                            onClick={() => handleRemoveAi(slot.key)}
                            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ba1a1a] bg-white text-[#ba1a1a] shadow-[2px_2px_0_#ba1a1a] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#ba1a1a]"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "16px" }}
                            >
                              delete
                            </span>
                          </button>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-black">
                          {slot.title}
                        </span>
                        {hasAllRawPhotos && (aiSrc || !isLoadingThis) && (
                          <button
                            type="button"
                            onClick={() => void handleRegenerateSingle(slot.key)}
                            disabled={isGeneratingAny}
                            className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0d59f2] transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="border-b border-[#0d59f2]">Regenerate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {panelMessage ? (
            <div className="border-2 border-black bg-[#dce1ff] px-4 py-3 text-sm font-bold text-black mt-8">
              {panelMessage}
            </div>
          ) : null}

          {panelError ? (
            <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-sm font-bold text-[#93000a] mt-8">
              {panelError}
            </div>
          ) : null}

          <div className="space-y-4 border-t-2 border-black pt-8 mt-8">
            <SubmitButton
              disabled={
                !selectedCategoryId ||
                !nameKa.trim() ||
                !hasAllAiPhotos ||
                isGeneratingAny
              }
            />
            <p className="text-center text-[11px] leading-5 text-black/60">
              `products.json` შეიცვლება მხოლოდ დადასტურების შემდეგ. საბოლოო სურათები უკვე მოიცავს მცირე და დიდ ვერსიებს.
            </p>
          </div>
        </form>
      </section>

      {cameraSlot ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 sm:items-center">
          <div className="w-full max-w-md overflow-hidden border-2 border-black bg-white">
            <div className="flex items-center justify-between border-b-2 border-black bg-[#F5F2ED] px-4 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">
                  კამერა
                </p>
                <h3 className="text-lg font-black tracking-tight text-black">
                  {photoSlots.find((slot) => slot.key === cameraSlot)?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="text-sm font-bold text-black/70 underline underline-offset-4"
              >
                დახურვა
              </button>
            </div>

            <div className="bg-black">
              {cameraError ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-6 text-center text-white">
                  <span className="material-symbols-outlined text-[52px]">
                    warning
                  </span>
                  <p className="text-sm leading-6 text-white/85">{cameraError}</p>
                  <div className="flex w-full flex-col gap-3">
                    <button
                      type="button"
                      onClick={openGalleryFromCameraModal}
                      className="border-2 border-white bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
                    >
                      გალერეიდან არჩევა
                    </button>
                    <button
                      type="button"
                      onClick={() => void openCamera(cameraSlot)}
                      className="border-2 border-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white"
                    >
                      თავიდან ცდა
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[3/4] w-full bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {cameraLoading && !cameraReady ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center text-white">
                      <span className="material-symbols-outlined text-[52px]">
                        photo_camera
                      </span>
                      <p className="text-sm leading-6 text-white/85">
                        კამერის ჩართვა მიმდინარეობს...
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {!cameraError ? (
              <div className="flex items-center justify-between border-t-2 border-black bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={openGalleryFromCameraModal}
                  className="text-sm font-bold text-black/70 underline underline-offset-4"
                >
                  გალერეიდან არჩევა
                </button>

                <button
                  type="button"
                  onClick={() => void capturePhoto()}
                  disabled={!cameraReady}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-black bg-[#0d59f2] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-black/30"
                  aria-label="ფოტოს გადაღება"
                >
                  <span className="material-symbols-outlined text-[28px]">
                    radio_button_checked
                  </span>
                </button>

                <button
                  type="button"
                  onClick={closeCamera}
                  className="text-sm font-bold text-black/70 underline underline-offset-4"
                >
                  გაუქმება
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
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

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function fitWithinBounds(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const largestSide = Math.max(width, height);

  if (largestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function requestGeneratedImages(
  categoryName: string,
  rawFiles: SlotFileMap,
  targetSlot?: ProductPhotoKind
): Promise<Partial<GeneratedImagesResponse>> {
  const formData = new FormData();
  formData.append("categoryName", categoryName);
  
  if (targetSlot) {
    formData.append("slotKey", targetSlot);
  }

  for (const slotKey of REQUIRED_PHOTO_KINDS) {
    const file = rawFiles[slotKey];

    if (!file) {
      throw new Error(`Missing raw file for ${slotKey}`);
    }

    formData.append(slotKey, file, file.name || `${slotKey}.jpg`);
  }

  const response = await fetch("/api/admin/generate-photo", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    images?: Partial<GeneratedImagesResponse>;
    error?: string;
  };

  if (!response.ok || !payload.success || !payload.images) {
    throw new Error(payload.error || "Generation failed");
  }

  const images = payload.images;

  const targetSlots = targetSlot ? [targetSlot] : REQUIRED_PHOTO_KINDS;

  for (const slotKey of targetSlots) {
    const image = images[slotKey];

    if (!image?.base64 || !image?.mimeType) {
      throw new Error(`Generated image is missing for ${slotKey}`);
    }
  }

  return images;
}

async function uploadGeneratedPhoto(
  slotKey: ProductPhotoKind,
  generatedImage: GeneratedImagePayload
): Promise<string> {
  const imageFiles = await buildGeneratedImageFiles(slotKey, generatedImage);

  const formData = new FormData();
  formData.append("file1600", imageFiles.file1600, imageFiles.file1600.name);
  formData.append("file800", imageFiles.file800, imageFiles.file800.name);

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    image?: string;
  };

  if (!response.ok || !payload.success || !payload.image) {
    throw new Error(`Upload failed for ${slotKey}`);
  }

  return payload.image;
}

async function buildGeneratedImageFiles(
  slotKey: ProductPhotoKind,
  generatedImage: GeneratedImagePayload
): Promise<{ file1600: File; file800: File }> {
  const sourceBlob = base64ToBlob(generatedImage.base64, generatedImage.mimeType);
  const objectUrl = URL.createObjectURL(sourceBlob);
  let image: HTMLImageElement | null = new window.Image();

  try {
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      if (!image) {
        reject(new Error("Image element missing"));
        return;
      }

      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image load failed"));
    });

    const blob1600 = await renderImageToWebp(image, 1600);
    const blob800 = await renderImageToWebp(image, 800);

    return {
      file1600: new File([blob1600], `${slotKey}-1600.webp`, {
        type: "image/webp",
      }),
      file800: new File([blob800], `${slotKey}-800.webp`, {
        type: "image/webp",
      }),
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

async function renderImageToWebp(
  image: HTMLImageElement,
  size: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available");
  }

  context.drawImage(image, 0, 0, size, size);

  try {
    return await canvasToBlob(canvas, "image/webp", 0.9);
  } finally {
    context.clearRect(0, 0, size, size);
    canvas.width = 0;
    canvas.height = 0;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas produced an empty blob"));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
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
