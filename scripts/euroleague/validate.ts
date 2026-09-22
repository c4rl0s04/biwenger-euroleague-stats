import sharp from 'sharp';
import { imageUrl } from './types';

export async function validateImage(url: string): Promise<{ width: number; height: number }> {
  imageUrl(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Official image request failed: ${response.status}`);
  }
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) {
    throw new Error(`Unexpected non-image MIME type: ${type}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Image dimensions unavailable');
  }
  if (meta.width < 16 || meta.height < 16) {
    throw new Error(`Image too small to be official portrait (${meta.width}x${meta.height})`);
  }
  return { width: meta.width, height: meta.height };
}
