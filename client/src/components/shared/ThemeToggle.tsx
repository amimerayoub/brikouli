/** Style: «دفتر الحيّ» — an unobtrusive, tactile control with quiet editorial contrast. */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return <button type="button" onClick={toggleTheme} className="theme-toggle touch-target" aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}>{isDark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}</button>;
}
