import React from "react";

type BrandIconSize = "sm" | "lg";

interface BrandIconProps {
  size?: BrandIconSize;
  className?: string;
}

const SIZE_CLASSES: Record<BrandIconSize, string> = {
  sm: "w-9 h-9 rounded-lg p-0.5",
  lg: "w-14 h-14 rounded-2xl p-1",
};

/**
 * Renders the Moleskine application icon inside a framed badge.
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  size = "sm",
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm overflow-hidden shrink-0 ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      <img
        src="/icon-192.png"
        alt="Ícone do Moleskine"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
