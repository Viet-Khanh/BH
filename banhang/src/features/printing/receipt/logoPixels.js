// Pure pixel math for the roll receipt logo (browser glue: logoImage.js).
// Thermal printers print 203 dpi ≈ 8 dots/mm, black or white only.
export const LOGO_DOTS_PER_MM = 8;
export const LOGO_MAX_HEIGHT_PX = 160;
export const LOGO_MAX_BYTES = 200 * 1024;
export const LOGO_THRESHOLD = 128;

// Target canvas size: never upscaled, at most the printable width in dots and
// LOGO_MAX_HEIGHT_PX tall, ratio kept. null for an empty image.
export const computeLogoSize = ({ width, height } = {}, printableMm) => {
  if (!(width > 0) || !(height > 0)) return null;
  const maxWidth = Math.max(1, Math.floor(printableMm * LOGO_DOTS_PER_MM));
  let targetWidth = Math.min(width, maxWidth);
  let targetHeight = (targetWidth * height) / width;
  if (targetHeight > LOGO_MAX_HEIGHT_PX) {
    targetHeight = LOGO_MAX_HEIGHT_PX;
    targetWidth = (targetHeight * width) / height;
  }
  return {
    width: Math.max(1, Math.round(targetWidth)),
    height: Math.max(1, Math.round(targetHeight)),
  };
};

// RGBA pixels (in place) → opaque black/white: luminance over a white background
// (transparent → white), then threshold.
export const thresholdPixels = (data, threshold = LOGO_THRESHOLD) => {
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    const gray =
      0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    const onWhite = gray * alpha + 255 * (1 - alpha);
    const value = onWhite < threshold ? 0 : 255;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }
  return data;
};

// The data URL is what gets stored in Settings.receiptLogo.
export const isLogoTooLarge = (dataUrl) =>
  String(dataUrl ?? '').length > LOGO_MAX_BYTES;
