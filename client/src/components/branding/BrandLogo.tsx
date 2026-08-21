/** Style: «دفتر الحيّ» — editorial warmth, tactile local trust, and Brikouli green as action. */
import { cn } from "@/lib/utils";

type BrandLogoProps = { compact?: boolean; className?: string };

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} aria-label="بريكولي">
      <img src="/manus-storage/brikouli-brand-mark_5bff2d69.png" alt="رمز بريكولي" className="h-10 w-10 shrink-0 object-contain" />
      {!compact && <div className="flex flex-col leading-none"><span className="font-brand text-[1.65rem] text-ink dark:text-white">بريكولي</span><span className="mt-1 text-[0.58rem] font-bold tracking-[0.19em] text-brand-green">فُرَص قَرِيبَة</span></div>}
    </div>
  );
}
