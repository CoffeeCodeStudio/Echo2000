/**
 * @module BentoCard
 * Flat early-2000s section box with dark header bar.
 */
import type { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  span?: "default" | "wide" | "tall";
}

const spanClasses = {
  default: "",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

export function BentoCard({ title, icon, children, className = "", contentClassName, span = "default" }: BentoCardProps) {
  return (
    <div className={`glass-card flex flex-col ${spanClasses[span]} ${className}`}>
      {/* Flat dark header */}
      <div className="lunar-box-header flex items-center gap-1.5 px-2 py-1.5">
        {icon && <span className="text-white/80 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
        <h3 className="font-bold text-[11px] tracking-wide uppercase">{title}</h3>
      </div>
      {/* Content */}
      <div className={`${contentClassName ?? "px-2 py-2"} flex-1 text-[11px]`}>{children}</div>
    </div>
  );
}
