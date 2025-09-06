import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Base system colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Official Telangana Police Colors
        primary: {
          DEFAULT: "#1e3a5f", // Official Police Navy Blue
          foreground: "#ffffff",
          hover: "#2563eb",
        },
        secondary: {
          DEFAULT: "#0ea5e9", // Interface Light Blue/Cyan
          foreground: "#ffffff",
          hover: "#0284c7",
        },

        // Status colors matching police theme
        success: {
          DEFAULT: "#059669", // Green for successful operations
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b", // Official Police Gold
          foreground: "#1f2937",
        },
        destructive: {
          DEFAULT: "#dc2626", // Official Police Red
          foreground: "#ffffff",
        },

        // UI colors
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#1e293b",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },

        // Sidebar colors
        sidebar: {
          DEFAULT: "#1e3a5f", // Police Navy Blue
          foreground: "#ffffff",
          primary: "#f59e0b", // Police Gold
          "primary-foreground": "#1f2937",
          accent: "#0ea5e9", // Light Blue
          "accent-foreground": "#ffffff",
          border: "rgba(255, 255, 255, 0.2)",
          ring: "#0ea5e9",
        },

        // Accommodation type colors (professional police palette)
        hotel: "#3b82f6", // Blue
        lodge: "#059669", // Emerald
        "guest-house": "#7c3aed", // Violet
        dormitory: "#f59e0b", // Police Gold
        pg: "#dc2626", // Police Red
        "service-apartment": "#0ea5e9", // Cyan
        hostel: "#65a30d", // Lime
        "rental-house": "#be185d", // Pink

        // Police specific colors
        "police-navy": "#1e3a5f",
        "police-red": "#dc2626",
        "police-gold": "#f59e0b",
        "police-black": "#1f2937",
        "police-cyan": "#0ea5e9",
      },

      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        "gradient-card": "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        "gradient-police": "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)",
      },

      boxShadow: {
        police:
          "0 10px 25px -5px rgba(30, 58, 95, 0.3), 0 4px 6px -2px rgba(30, 58, 95, 0.1)",
        glow: "0 0 20px rgba(14, 165, 233, 0.3)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        badge: "0 4px 14px 0 rgba(245, 158, 11, 0.39)",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(14, 165, 233, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(14, 165, 233, 0.8)",
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
