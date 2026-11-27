/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Phone / camera photos are often 3-10 MB. Many servers (nginx's default is 1 MB)
 * drop such a request before Laravel ever sees it, and the browser then only
 * reports "Cannot reach the server". A resized WebP/JPEG is usually 50-300 KB, so
 * the upload goes through everywhere and is much faster.
 *
 * Never throws: if anything goes wrong the original file is returned unchanged.
 */
export async function shrinkImage(
  file: File,
  opts: { maxWidth: number; maxHeight: number; quality?: number },
): Promise<File> {
  try {
    if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;
    if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, opts.maxWidth / width, opts.maxHeight / height);

    // Already small enough in both size and weight: keep it as it is.
    if (scale === 1 && file.size <= 300 * 1024) return file;

    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const quality = opts.quality ?? 0.85;
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (!blob) return file;

    // Resizing never makes the upload bigger.
    if (scale === 1 && blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back to <img> below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read the image."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
