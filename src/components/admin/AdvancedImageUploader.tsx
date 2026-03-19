"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import Image from "next/image";

export type ImageAsset = {
  id: string;
  src: string;
  order: number;
};

type AdvancedImageUploaderProps = {
  existingImages?: ImageAsset[];
};

export default function AdvancedImageUploader({
  existingImages = [],
}: AdvancedImageUploaderProps) {
  const [images, setImages] = useState<ImageAsset[]>(
    [...existingImages].sort((a, b) => a.order - b.order)
  );

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverPhotos, setServerPhotos] = useState<string[]>([]);
  const [loadingServerPhotos, setLoadingServerPhotos] = useState(false);

  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setCropImageSrc(objectUrl);
      e.target.value = ""; // Reset for future uploads
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Only accept images
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
      }
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const generateWebpBlob = async (
    imageSrc: string,
    pixelCrop: Area,
    finalSize: number
  ): Promise<Blob> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = finalSize;
    canvas.height = finalSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalSize,
      finalSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("Empty blob"));
          else resolve(blob);
        },
        "image/webp",
        0.9
      );
    });
  };

  const handleCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);

      const blob1600 = await generateWebpBlob(cropImageSrc, croppedAreaPixels, 1600);
      const blob800 = await generateWebpBlob(cropImageSrc, croppedAreaPixels, 800);

      const formData = new FormData();
      formData.append("file1600", blob1600, "main.webp");
      formData.append("file800", blob800, "mobile.webp");

      const res = await fetch("/api/admin/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      
      if (data.success && data.image) {
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 10),
            src: data.image,
            order: prev.length > 0 ? Math.max(...prev.map((i) => i.order)) + 1 : 1,
          },
        ]);
        setCropImageSrc(null); // Close cropper modal
      }
    } catch (error) {
      console.error("Error cropping and uploading:", error);
      alert("შეცდომა ფოტოს ატვირთვისას.");
    } finally {
      setIsUploading(false);
    }
  };

  const openServerPhotosModal = async () => {
    setIsServerModalOpen(true);
    setLoadingServerPhotos(true);
    try {
      const res = await fetch("/api/admin/images");
      if (res.ok) {
        const data = await res.json();
        setServerPhotos(data.images || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingServerPhotos(false);
    }
  };

  const selectServerPhoto = (src: string) => {
    setImages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 10),
        src,
        order: prev.length > 0 ? Math.max(...prev.map((i) => i.order)) + 1 : 1,
      },
    ]);
    setIsServerModalOpen(false);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateOrder = (id: string, newOrder: number) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, order: newOrder } : img))
    );
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-black bg-[#F5F2ED] hover:bg-black/5 p-6 font-mono text-[10px] tracking-[0.2em] font-black uppercase transition-colors flex items-center justify-center text-center cursor-pointer min-h-[100px]"
        >
          UPLOAD_ASSET / ავტირთვა & ჩაგდება
        </div>
        <button
          type="button"
          onClick={openServerPhotosModal}
          className="flex-1 border-2 border-dashed border-black bg-[#F5F2ED] hover:bg-black/5 p-6 font-mono text-[10px] tracking-[0.2em] font-black uppercase transition-colors"
        >
          BROWSE_SERVER / სერვერიდან
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-2 border-black p-6 bg-white">
          {images
            .sort((a, b) => a.order - b.order)
            .map((img) => (
              <div key={img.id} className="border-2 border-black bg-[#F5F2ED] p-4 flex flex-col">
                <div className="relative aspect-square w-full border-2 border-black mb-4">
                  <Image
                    src={img.src}
                    alt="Product"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-auto space-y-3 pt-3 border-t-2 border-black">
                  <label className="block">
                    <span className="block font-mono text-[10px] tracking-widest mb-1 opacity-60 uppercase">
                      INDEX / რიგი
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={img.order}
                      onChange={(e) => updateOrder(img.id, parseInt(e.target.value) || 1)}
                      className="w-full bg-white border-2 border-black p-2 font-mono text-xs focus:outline-none rounded-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="w-full border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white p-2 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                    REMOVE / წაშლა
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Cropper Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-black w-full max-w-3xl flex flex-col h-[80vh]">
            <div className="p-4 border-b-2 border-black flex justify-between items-center bg-[#F5F2ED]">
              <h3 className="font-mono text-[12px] font-black tracking-widest uppercase">
                ASSET_CROP / ჩამოჭრა (1:1 RATIO)
              </h3>
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="font-mono text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100"
              >
                CANCEL / გაუქმება
              </button>
            </div>
            <div className="relative flex-1 bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 border-t-2 border-black flex flex-col sm:flex-row gap-4 items-center bg-[#F5F2ED]">
              <div className="flex-1 w-full space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest opacity-60">ZOOM_LEVEL / მოახლოება</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>
              <button
                type="button"
                onClick={handleCropAndUpload}
                disabled={isUploading}
                className="bg-primary text-white border-2 border-black px-8 py-4 font-mono text-[11px] tracking-[0.2em] font-black uppercase hover:bg-black transition-colors min-w-[200px]"
              >
                {isUploading ? "UPLOADING..." : "CROP & UPLOAD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Photos Modal */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#F5F2ED] border-2 border-black w-full max-w-5xl flex flex-col h-[85vh]">
            <div className="p-6 border-b-2 border-black flex justify-between items-center bg-white shrink-0">
              <h3 className="font-mono text-[14px] font-black tracking-widest uppercase text-primary">
                SERVER_DIRECTORY / სერვერზე არსებული ფოტოები
              </h3>
              <button
                type="button"
                onClick={() => setIsServerModalOpen(false)}
                className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 border-2 border-transparent hover:border-black py-1 px-3"
              >
                CLOSE / დახურვა
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden">
              {loadingServerPhotos ? (
                <div className="h-full flex items-center justify-center font-mono opacity-50 uppercase tracking-widest text-[12px]">
                  LOADING_ASSETS...
                </div>
              ) : serverPhotos.length === 0 ? (
                <div className="h-full flex items-center justify-center font-mono opacity-50 uppercase tracking-widest text-[12px]">
                  ASSETS_NOT_FOUND
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {serverPhotos.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => selectServerPhoto(src)}
                      className="group relative aspect-square border-2 border-black hover:border-primary transition-colors overflow-hidden bg-white"
                    >
                      <Image
                        src={src}
                        alt="Server Asset"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <span className="bg-black text-white font-mono text-[10px] tracking-widest px-3 py-1 opacity-0 group-hover:opacity-100 uppercase transition-opacity">
                          SELECT
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
