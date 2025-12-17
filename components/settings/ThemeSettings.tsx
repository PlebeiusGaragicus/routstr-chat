"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground/80 mb-2">Theme</h3>
        <div className="bg-muted/50 border border-border rounded-md p-1 flex gap-1">
          <div className="flex-1 h-9 bg-muted rounded animate-pulse" />
          <div className="flex-1 h-9 bg-muted rounded animate-pulse" />
          <div className="flex-1 h-9 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-foreground/80 mb-2">Theme</h3>
      <div className="bg-muted/50 border border-border rounded-md p-1 flex gap-1">
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              theme === id
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground/40 mt-2">
        {theme === "system"
          ? "Theme follows your system preferences"
          : `Using ${theme} theme`}
      </p>
    </div>
  );
}
