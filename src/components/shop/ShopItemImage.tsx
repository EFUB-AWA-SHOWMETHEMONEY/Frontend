import Image from 'next/image';

/** Both the outer image and the embedded PNG use nearest-neighbor sampling. */
export default function ShopItemImage({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <Image
      src={src.replace('/assets/items/', '/assets/items/pixelated/')}
      alt={alt}
      width={160}
      height={160}
      unoptimized
    />
  );
}
