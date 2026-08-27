import { useState } from 'react';
import { PhotoThumb } from './PhotoThumb.js';
import { Lightbox } from './Lightbox.js';

interface Props {
  photos: string[];
}

export function PhotoGallery({ photos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-1 flex flex-wrap gap-2">
        {photos.map((key, index) => (
          <PhotoThumb key={key} photoKey={key} onClick={() => setOpenIndex(index)} />
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox photos={photos} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
