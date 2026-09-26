'use client';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

// Devices are drawn, not photographed: a thin-bezel display and a phone, both flat-lit so the work stays the subject.

type ShotProps = { src: string; srcSet?: string; sizes?: string; alt: string; eager?: boolean; tall?: boolean };

export const Display = forwardRef<HTMLDivElement, { shot?: ShotProps; children?: ReactNode; className?: string; style?: CSSProperties; innerRef?: React.Ref<HTMLDivElement> }>(
  function Display({ shot, children, className = '', style, innerRef }, ref) {
    return (
      <div ref={ref} className={`dev-display ${className}`} style={style}>
        <div className="dev-display-screen">
          <div className={`dev-scroll ${shot?.tall ? 'is-tall' : 'is-fill'}`} ref={innerRef}>
            {shot ? <img src={shot.src} srcSet={shot.srcSet} sizes={shot.sizes} alt={shot.alt} loading={shot.eager ? 'eager' : 'lazy'} decoding="async" draggable={false} /> : children}
          </div>
        </div>
        <div className="dev-display-chin" aria-hidden="true" />
      </div>
    );
  },
);

export const Phone = forwardRef<HTMLDivElement, { shot?: ShotProps; children?: ReactNode; className?: string; style?: CSSProperties; innerRef?: React.Ref<HTMLDivElement>; dark?: boolean }>(
  function Phone({ shot, children, className = '', style, innerRef, dark }, ref) {
    return (
      <div ref={ref} className={`dev-phone ${dark ? 'is-dark' : ''} ${className}`} style={style}>
        <div className="dev-phone-screen">
          <div className={`dev-scroll ${shot?.tall ? 'is-tall' : 'is-fill'}`} ref={innerRef}>
            {shot ? <img src={shot.src} srcSet={shot.srcSet} sizes={shot.sizes} alt={shot.alt} loading={shot.eager ? 'eager' : 'lazy'} decoding="async" draggable={false} /> : children}
          </div>
          <span className="dev-island" aria-hidden="true" />
        </div>
      </div>
    );
  },
);

// work images: {slug}-{d|dt|m|mt}-{w}.webp
export const work = {
  d: (s: string) => ({ src: `/work/${s}-d-1600.webp`, srcSet: `/work/${s}-d-960.webp 960w, /work/${s}-d-1600.webp 1600w, /work/${s}-d-2400.webp 2400w` }),
  dt: (s: string) => ({ src: `/work/${s}-dt-1200.webp`, srcSet: `/work/${s}-dt-1200.webp 1200w, /work/${s}-dt-1800.webp 1800w`, tall: true }),
  m: (s: string) => ({ src: `/work/${s}-m-780.webp`, srcSet: `/work/${s}-m-390.webp 390w, /work/${s}-m-780.webp 780w` }),
  mt: (s: string) => ({ src: `/work/${s}-mt-720.webp`, srcSet: `/work/${s}-mt-360.webp 360w, /work/${s}-mt-720.webp 720w`, tall: true }),
};
