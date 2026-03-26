/**
 * @module BentoCard
 * Lunar-themed box card with orange gradient header.
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
      {/* Lunar orange gradient header */}
      <div className="lunar-box-header flex items-center gap-2 px-4 py-2">
        {icon && <span className="text-white/90">{icon}</span>}
        <h3 className="font-display font-bold text-sm tracking-wide">{title}</h3>
      </div>
      {/* Content */}
      <div className={`${contentClassName ?? "px-4 py-3"} flex-1`} style={{ padding: contentClassName ? undefined : undefined }}>{children}</div>
    </div>
  );
}
