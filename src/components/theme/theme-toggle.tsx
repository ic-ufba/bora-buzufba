import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        const button = e.currentTarget;
        button.blur();
        setTheme(theme === "light" ? "dark" : "light");
      }}
      className="w-9 h-9 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:bg-transparent hover:bg-transparent active:bg-transparent text-white hover:text-white/80 transition-colors"
      onMouseDown={(e) => e.preventDefault()}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}