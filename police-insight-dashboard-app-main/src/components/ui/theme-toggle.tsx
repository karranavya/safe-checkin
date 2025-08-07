import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full border-2 transition-all duration-300 hover:scale-110"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-primary" />
      ) : (
        <Sun className="h-4 w-4 text-warning" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};