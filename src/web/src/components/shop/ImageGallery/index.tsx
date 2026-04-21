"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

interface ImageGalleryProps {
  images: ProductImage[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  const [active, setActive] = useState<ProductImage | undefined>(primary);

  if (!images.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted text-5xl">
        📦
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={active?.url ?? images[0].url}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                active?.id === img.id
                  ? "border-primary"
                  : "border-transparent opacity-60"
              )}
            >
              <Image
                src={img.url}
                alt={name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
