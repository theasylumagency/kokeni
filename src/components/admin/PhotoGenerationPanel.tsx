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
    setRawFiles((current) => ({
      ...current,
      [slotKey]: file,
    }));
    clearGeneratedImages();
    setPanelError(null);
    setPanelMessage(
      file
        ? "სამივე ხედის მიღების შემდეგ დააჭირეთ Gemini-ის გენერაციას."
        : "წაშლის შემდეგ გენერირებული ფოტოები განულდა. გადაიღეთ საჭირო კადრები თავიდან."
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

          <div className="space-y-4">
            <div className="space-y-2">
              <p className={labelClass}>სამი reference ფოტო</p>
              <p className="text-sm leading-6 text-black/70">
                ცარიელ ფრეიმზე დაჭერით პირდაპირ გაიხსნება ბრაუზერის კამერა. თუ
                კამერა ვერ ჩაირთო, იმავე ხედისთვის შეგიძლიათ გალერეიდან აირჩიოთ
                ფოტო.
              </p>
            </div>

            <div className="grid gap-4">
              {photoSlots.map((slot) => {
                const rawFile = rawFiles[slot.key];
                const aiSrc = aiImages[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="grid gap-4 border-2 border-black bg-[#F5F2ED] p-4 sm:grid-cols-[minmax(0,170px)_minmax(0,170px)_minmax(0,1fr)]"
                  >
                    <div className="space-y-3">
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

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => void openCamera(slot.key)}
                          disabled={isGeneratingAny}
                          className="block w-full overflow-hidden border-2 border-black bg-white text-left transition-colors hover:border-[#0d59f2] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="aspect-[4/5]">
                            {rawFile ? (
                              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                                <span className="material-symbols-outlined text-[42px] text-[#0a5c36]">
                                  check_circle
                                </span>
                                <div className="space-y-1">
                                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a5c36]">
                                    ფოტო მიღებულია
                                  </p>
                                  <p className="text-[11px] leading-5 text-black/55">
                                    ხელახლა გადასაღებად ისევ შეეხეთ ფრეიმს.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                                <span className="material-symbols-outlined text-[42px] text-black/50">
                                  photo_camera
                                </span>
                                <div className="space-y-1">
                                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/70">
                                    ფოტოს გადასაღებად შეეხეთ
                                  </p>
                                  <p className="text-[11px] leading-5 text-black/50">
                                    ბრაუზერის კამერა გაიხსნება პირდაპირ.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>

                        {rawFile ? (
                          <button
                            type="button"
                            aria-label="ფოტოს წაშლა"
                            onClick={() => handleRemoveRaw(slot.key)}
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
                    </div>

                    <div className="relative overflow-hidden border-2 border-black bg-white">
                      <div className="aspect-[4/5]">
                        {aiSrc ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={aiSrc}
                              alt={slot.title}
                              fill
                              sizes="(min-width: 640px) 170px, 44vw"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                            <span className="material-symbols-outlined text-[42px] text-black/30">
                              auto_awesome
                            </span>
                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                              {isGeneratingAll || isGeneratingSlot === slot.key
                                ? "გენერაცია მიმდინარეობს"
                                : "AI შედეგი"}
                            </p>
                          </div>
                        )}
                      </div>

                      {aiSrc ? (
                        <button
                          type="button"
                          aria-label="AI ფოტოს წაშლა"
                          onClick={() => handleRemoveAi(slot.key)}
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
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight text-black">
                            {slot.title}
                          </h3>
                          <span
                            className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              rawFile
                                ? "border-[#0a5c36] bg-[#daf2e6] text-[#0a5c36]"
                                : "border-[#93000a] bg-[#ffdad6] text-[#93000a]"
                            }`}
                          >
                            {rawFile ? "reference მზადაა" : "reference აკლია"}
                          </span>
                          <span
                            className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              aiSrc
                                ? "border-[#0d59f2] bg-[#dce1ff] text-[#0d59f2]"
                                : "border-black/30 bg-white text-black/45"
                            }`}
                          >
                            {aiSrc ? "AI მზადაა" : "AI ჯერ არ არის"}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-black/70">{slot.hint}</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => openGallery(slot.key)}
                          disabled={isGeneratingAny}
                          className="text-sm font-bold text-black/70 underline underline-offset-4 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50 inline-block text-left"
                        >
                          გალერეიდან არჩევა
                        </button>
                        {hasAllRawPhotos ? (
                          <button
                            type="button"
                            onClick={() => void handleRegenerateSingle(slot.key)}
                            disabled={isGeneratingAny}
                            className="text-sm font-bold text-[#0d59f2] underline underline-offset-4 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50 inline-block text-left"
                          >
                            ხელახლა გენერაცია
                          </button>
                        ) : null}
                      </div>
                      <p className="text-sm text-black/60">
                        {hasAllRawPhotos 
                          ? "შეგიძლიათ მხოლოდ ამ ხედის თავიდან გენერაცია ღილაკზე დაჭერით." 
                          : "სამივე ფოტო აუცილებელია გენერაციისთვის."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {panelMessage ? (
            <div className="border-2 border-black bg-[#dce1ff] px-4 py-3 text-sm text-black">
              {panelMessage}
            </div>
          ) : null}

          {panelError ? (
            <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
              {panelError}
            </div>
          ) : null}

          <div className="space-y-4 border-t-2 border-black pt-6">
            <button
              type="button"
              onClick={() => void handleGenerateAll()}
              disabled={!selectedCategory || !hasAllRawPhotos || isGeneratingAny}
              className="w-full border-2 border-black bg-black px-6 py-5 text-center text-sm font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#0d59f2] disabled:cursor-not-allowed disabled:bg-black/30"
            >
              {isGeneratingAny
                ? "მიმდინარეობს გენერაცია..."
                : "სამივე ფოტოს გენერაცია"}
            </button>

            <p className="text-sm leading-6 text-black/70">
              პროდუქტი შეიქმნება როგორც დრაფტი. `products.json` შეიცვლება მხოლოდ
              მაშინ, როცა ქვემოთ დააჭერთ ახალი პროდუქტის შექმნას.
            </p>

            <SubmitButton
              disabled={
                !selectedCategoryId ||
                !nameKa.trim() ||
                !hasAllAiPhotos ||
                isGeneratingAny
              }
            />
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
