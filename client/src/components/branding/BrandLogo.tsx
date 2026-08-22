/** Style: «دفتر الحيّ» — editorial warmth, tactile local trust, and Brikouli green as action. */
import { cn } from "@/lib/utils";

type BrandLogoProps = { compact?: boolean; className?: string };

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)} aria-label="بريكولي">
      <img src="/manus-storage/brikouli-symbol-optimized_2432a297.png" alt="رمز بريكولي" className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
      {!compact && <div className="hidden min-w-0 flex-col leading-none min-[430px]:flex"><span className="font-brand text-[1.65rem] text-ink dark:text-white">بريكولي</span><span className="mt-1 whitespace-nowrap text-[0.58rem] font-bold tracking-[0.19em] text-brand-green">فُرَص قَرِيبَة</span></div>}
    </div>
  );
}
