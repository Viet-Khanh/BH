// Browser-only: image file → black/white PNG data URL sized for the roll printer.
// Errors carry a user-facing message (shown by the caller).
import {
  computeLogoSize,
  isLogoTooLarge,
  thresholdPixels,
} from './logoPixels.js';

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh logo.'));
    };
    image.src = url;
  });

export const readLogoFile = async (file, printableMm) => {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Logo phải là tệp ảnh (PNG, JPG…).');
  }
  const image = await loadImage(file);
  const size = computeLogoSize(
    { width: image.naturalWidth, height: image.naturalHeight },
    printableMm
  );
  if (!size) throw new Error('Ảnh logo trống.');
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, size.width, size.height);
  const pixels = context.getImageData(0, 0, size.width, size.height);
  thresholdPixels(pixels.data);
  context.putImageData(pixels, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  if (isLogoTooLarge(dataUrl)) {
    throw new Error('Logo sau khi xử lý vẫn quá lớn (tối đa 200 KB).');
  }
  return dataUrl;
};
