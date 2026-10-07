import React from 'react';

interface BatchLogoProps {
  className?: string;
  showBackground?: boolean;
}

export const BATCH_LOGO_URL = '/icon.svg';

export const BatchLogo: React.FC<BatchLogoProps> = ({
  className = 'w-10 h-10',
  showBackground = false,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        showBackground
          ? 'bg-white dark:bg-slate-100 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-slate-700'
          : ''
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        className="w-full h-full object-contain"
        aria-label="شعار الدفعة المطورة لمنصة دفعتي"
      >
        {/* Top & Left Dark Navy Outer Hexagon Frame */}
        <polygon
          points="500,132 644,215 572,257 500,215 301,330 301,436 229,478 229,288"
          fill="#081c38"
        />

        {/* Bottom & Right Dark Navy Outer Hexagon Frame */}
        <polygon
          points="771,520 771,675 500,832 356,749 441,720 500,754 699,639 699,562"
          fill="#081c38"
        />

        {/* Inner Left Dark Navy Pillar ('I' stem) */}
        <polygon
          points="350,362 433,314 433,668 350,620"
          fill="#081c38"
        />

        {/* Blue Lower-Left Hexagon Corner Extension */}
        <polygon
          points="229,515 301,473 301,592 414,657 315,688 229,638"
          fill="#0068bd"
        />

        {/* Isometric 3D Blue 'T' */}
        <polygon
          points="502,252 730,384 730,473 623,411 623,620 538,669 538,362 457,315 457,278"
          fill="#0068bd"
        />

        {/* Upper-Right Blue Orbital Arc & Node */}
        <path
          d="M 596,281 C 655,258 708,257 748,268 L 726,287 C 692,279 645,278 596,281 Z"
          fill="#0068bd"
        />
        <circle cx="770" cy="285" r="37" fill="#0068bd" />
        <path
          d="M 816,294 C 898,350 845,468 643,590 L 643,558 C 805,452 848,362 795,318 Z"
          fill="#0068bd"
        />

        {/* Lower-Left Blue Orbital Arc & Node */}
        <path
          d="M 328,452 C 212,535 168,615 190,666 L 154,692 C 110,632 162,532 308,448 Z"
          fill="#0068bd"
        />
        <circle cx="229" cy="696" r="41" fill="#0068bd" />
        <path
          d="M 282,692 C 345,688 415,672 486,645 C 425,688 352,712 279,717 Z"
          fill="#0068bd"
        />
      </svg>
    </div>
  );
};
