/**
 * @module BentoCard
 * Polished early-2000s section box with gradient header and orange accent.
 */
import type { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  span?: "default" | "wide" | "tall";
  headerAction?: ReactNode;
}

const spanClasses = {
  default: "",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

export function BentoCard({ title, icon, children, className = "", contentClassName, span = "default", headerAction }: BentoCardProps) {
  return (
    <div className={`glass-card flex flex-col ${spanClasses[span]} ${className}`}>
      {/* Polished header with gradient + orange bottom accent */}
      <div className="lunar-box-header flex items-center gap-1.5 px-2.5 py-1.5">
        {icon && <span className="text-white/90 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
        <h3 className="font-bold text-[11px] tracking-wide uppercase flex-1">{title}</h3>
        {headerAction && <span className="ml-auto">{headerAction}</span>}
      </div>
      {/* Content */}
      <div className={`${contentClassName ?? "px-2.5 py-2.5"} flex-1 text-[11px]`}>{children}</div>
    </div>
  );
}
