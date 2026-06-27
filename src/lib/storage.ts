import { supabase } from "./supabase";

const STORAGE_BUCKET = "entry_media";

export async function uploadImage(file: File, userId: string): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return {
    url: data.publicUrl,
    path: fileName,
  };
}

export async function uploadImages(files: File[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const { url } = await uploadImage(file, userId);
    urls.push(url);
  }
  return urls;
}

export async function deleteImage(path: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
