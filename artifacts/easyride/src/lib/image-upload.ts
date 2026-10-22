/**
 * Client side image helpers for the staff console.
 *
 * There is no upload backend — a photo is kept as a data URL in localStorage.
 * Pictures are downscaled first so a couple of megabytes of camera roll does
 * not blow the storage quota.
 */

/** Largest width (px) a stored photo is scaled down to. */
const MAX_WIDTH = 900;
/** JPEG quality used when re-encoding. */
const QUALITY = 0.82;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the image."));
    image.src = src;
  });

/**
 * Turn a picked file into a storable data URL.
 *
 * Images are re-encoded as JPEG and scaled down; anything that is not an
 * image is rejected with a message for the UI to show.
 */
export async function fileToStorableImage(
  file: File,
): Promise<{ dataUrl: string } | { error: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Pick an image file (JPG, PNG or WebP)." };
  }
  if (file.size > 12 * 1024 * 1024) {
    return { error: "That photo is larger than 12 MB. Pick a smaller one." };
  }

  try {
    const raw = await readAsDataUrl(file);
    const image = await loadImage(raw);
    const scale = Math.min(1, MAX_WIDTH / image.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return { dataUrl: raw };
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", QUALITY) };
  } catch {
    return { error: "That file could not be read as an image." };
  }
}
