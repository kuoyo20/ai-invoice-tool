/**
 * 圖片壓縮工具
 * 手機拍照動輒 5-8MB，壓到 1600px 寬即可，Gemini 辨識不受影響
 */

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const JPEG_QUALITY = 0.85;

export async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  // PDF 不壓縮
  if (file.type === "application/pdf") {
    const base64 = await fileToBase64(file);
    return { base64, mimeType: file.type };
  }

  // 非圖片不壓縮
  if (!file.type.startsWith("image/")) {
    const base64 = await fileToBase64(file);
    return { base64, mimeType: file.type };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // 如果已經夠小，直接回傳原圖
      if (width <= MAX_WIDTH && height <= MAX_HEIGHT && file.size < 500_000) {
        fileToBase64(file).then((base64) => resolve({ base64, mimeType: file.type }));
        return;
      }

      // 計算縮放比例
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("無法建立 canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // 轉成 JPEG base64
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.onerror = () => reject(new Error("無法載入圖片"));
    img.src = URL.createObjectURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
