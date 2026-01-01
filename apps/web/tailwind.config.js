/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--bg-main)",
                foreground: "var(--text-main)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "#ffffff",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "#ffffff",
                },
                muted: "var(--text-muted)",
                destructive: {
                    DEFAULT: "var(--danger)",
                    foreground: "#ffffff",
                },
                border: "var(--border-glass)",
                input: "var(--bg-glass-lighter)",
                ring: "var(--primary)",
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
        },
    },
    plugins: [],
}
