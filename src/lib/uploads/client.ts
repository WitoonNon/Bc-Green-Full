"use client";

type UploadFolder = "tickets" | "repairs" | "promotions" | "avatars" | "vehicles";

export type LocalUploadResult = {
  url: string;
  path: string;
  name: string;
  type: string;
};

export async function uploadLocalFile(
  file: File,
  folder: UploadFolder,
): Promise<LocalUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorText = "Upload failed.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        errorText = data.error;
      }
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(errorText);
  }

  return (await response.json()) as LocalUploadResult;
}

export async function uploadLocalFiles(
  files: File[],
  folder: UploadFolder,
  onProgress?: (value: number) => void,
) {
  if (!files.length) {
    return [];
  }

  const results: LocalUploadResult[] = [];
  let uploaded = 0;
  for (const file of files) {
    const result = await uploadLocalFile(file, folder);
    results.push(result);
    uploaded += 1;
    onProgress?.(Math.round((uploaded / files.length) * 100));
  }
  return results;
}
