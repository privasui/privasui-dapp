import { useRef, useState } from 'react';

export function useFilePicker() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileBytes, _setFileBytes] = useState<Uint8Array | null>(null);
  const [previewUrl, _setPreviewUrl] = useState<string | null>(null);

  const trigger = () => inputRef.current?.click();

  // const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   const arrayBuffer = await file.arrayBuffer();
  //   const bytes = new Uint8Array(arrayBuffer);
  //   setFileBytes(bytes);

  //   // Optional image preview
  //   if (file.type.startsWith('image/')) {
  //     const url = URL.createObjectURL(file);
  //     setPreviewUrl(url);
  //   } else {
  //     setPreviewUrl(null);
  //   }
  // };

  return {
    fileBytes,
    previewUrl,
    trigger,
    fileInput: (
        "FILE INPUT:: use-file-picker"
    ),
  };
}