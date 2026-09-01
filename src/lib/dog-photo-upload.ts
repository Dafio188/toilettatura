import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const DOG_PHOTO_BUCKET = "dog-photos";
export const DOG_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const DOG_PHOTO_ACCEPTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

export type ValidatedDogPhoto = {
  readonly kind: "OK";
  readonly file: File;
  readonly bytes: number;
  readonly mime: string;
  readonly extension: string;
  readonly objectKey: string;
  readonly previewDataUrl: string;
};

export type DogPhotoValidationError =
  | { kind: "EMPTY" }
  | { kind: "TOO_LARGE"; maxBytes: number; actualBytes: number }
  | { kind: "BAD_MIME"; accepted: readonly string[]; actual: string }
  | { kind: "NO_USER" };

export function validateDogPhotoFile(
  file: File,
  ownerUserId: string | null | undefined
): ValidatedDogPhoto | DogPhotoValidationError {
  if (!ownerUserId) return { kind: "NO_USER" };
  if (!file || file.size <= 0) return { kind: "EMPTY" };
  if (file.size > DOG_PHOTO_MAX_BYTES) {
    return {
      kind: "TOO_LARGE",
      maxBytes: DOG_PHOTO_MAX_BYTES,
      actualBytes: file.size
    };
  }
  const mime = file.type || "";
  if (!DOG_PHOTO_ACCEPTED_MIME.has(mime)) {
    return {
      kind: "BAD_MIME",
      accepted: Array.from(DOG_PHOTO_ACCEPTED_MIME),
      actual: mime
    };
  }
  const extensionMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  const extension = extensionMap[mime] ?? "bin";
  const safeStem = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const objectKey = `${ownerUserId}/${safeStem}.${extension}`;
  // Il preview viene costruito dal chiamante via URL.createObjectURL (non qui per testabilità).
  return {
    kind: "OK",
    file,
    bytes: file.size,
    mime,
    extension,
    objectKey,
    previewDataUrl: ""
  };
}

export function describeDogPhotoError(
  err: DogPhotoValidationError
): string {
  switch (err.kind) {
    case "EMPTY":
      return "Nessun file selezionato.";
    case "NO_USER":
      return "Devi effettuare l'accesso per caricare una foto.";
    case "TOO_LARGE": {
      const maxMb = (err.maxBytes / 1024 / 1024).toFixed(1);
      const actualMb = (err.actualBytes / 1024 / 1024).toFixed(2);
      return `File troppo grande (${actualMb} MB). Dimensione massima: ${maxMb} MB.`;
    }
    case "BAD_MIME":
      return `Formato non supportato (${err.actual || "sconosciuto"}). Usa PNG, JPG, WebP o GIF.`;
  }
}

export async function uploadDogPhoto(
  supabase: SupabaseClient<Database>,
  validated: ValidatedDogPhoto
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .upload(validated.objectKey, validated.file, {
      cacheControl: "public, max-age=31536000, immutable",
      contentType: validated.mime,
      upsert: false
    });
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Errore durante il caricamento." };
  }
  const { data: publicUrlData } = supabase.storage
    .from(DOG_PHOTO_BUCKET)
    .getPublicUrl(data.path);
  return { ok: true, publicUrl: publicUrlData.publicUrl };
}

export async function deleteDogPhotoIfOwned(
  supabase: SupabaseClient<Database>,
  ownerUserId: string,
  photoUrl: string | null | undefined
): Promise<void> {
  if (!photoUrl) return;
  const bucketPrefix = `/storage/v1/object/public/${DOG_PHOTO_BUCKET}/`;
  const idx = photoUrl.indexOf(bucketPrefix);
  const objectKey = idx >= 0
    ? photoUrl.slice(idx + bucketPrefix.length)
    : null;
  if (!objectKey) return;
  const folderOwner = objectKey.split("/")[0];
  if (folderOwner !== ownerUserId) return;
  await supabase.storage.from(DOG_PHOTO_BUCKET).remove([objectKey]);
}
