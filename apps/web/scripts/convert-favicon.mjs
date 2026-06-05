import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function createFavicons() {
  const inputPath = join(publicDir, 'logo.png');

  // Create square favicon versions at different sizes
  const sizes = [16, 32, 48, 64, 128, 192, 512];

  for (const size of sizes) {
    const outputPath = join(publicDir, `favicon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(outputPath);
    console.log(`Created ${outputPath}`);
  }

  // Also create a main favicon.png (32x32 is standard)
  const mainFaviconPath = join(publicDir, 'favicon.png');
  await sharp(inputPath)
    .resize(32, 32, { fit: 'cover', position: 'center' })
    .png()
    .toFile(mainFaviconPath);
  console.log(`Created ${mainFaviconPath}`);

  // Create Apple touch icon (180x180)
  const appleIconPath = join(publicDir, 'apple-touch-icon.png');
  await sharp(inputPath)
    .resize(180, 180, { fit: 'cover', position: 'center' })
    .png()
    .toFile(appleIconPath);
  console.log(`Created ${appleIconPath}`);

  // PWA install icons (manifest)
  for (const size of [192, 512]) {
    const pwaPath = join(publicDir, `pwa-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(pwaPath);
    console.log(`Created ${pwaPath}`);
  }

  // Maskable icon: logo inset ~20% for Android adaptive icon safe zone
  const maskableSize = 512;
  const inset = Math.round(maskableSize * 0.12);
  const logoSize = maskableSize - inset * 2;
  const maskablePath = join(publicDir, 'pwa-maskable-512x512.png');
  const logoBuffer = await sharp(inputPath)
    .resize(logoSize, logoSize, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, top: inset, left: inset }])
    .png()
    .toFile(maskablePath);
  console.log(`Created ${maskablePath}`);
}

createFavicons().catch(console.error);
