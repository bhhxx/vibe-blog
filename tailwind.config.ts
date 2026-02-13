import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: ({ theme }: any) => ({
        DEFAULT: {
          css: {
            fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
            lineHeight: '1.6',
            fontSize: '1rem',
            'h1': {
              fontSize: '2em',
              fontWeight: '700',
              marginTop: '1.2em',
              marginBottom: '0.6em',
              lineHeight: '1.3',
            },
            'h2': {
              fontSize: '1.5em',
              fontWeight: '600',
              marginTop: '1em',
              marginBottom: '0.5em',
              lineHeight: '1.3',
            },
            'h3': {
              fontSize: '1.25em',
              fontWeight: '600',
              marginTop: '0.8em',
              marginBottom: '0.4em',
              lineHeight: '1.4',
            },
            'h4': {
              fontSize: '1em',
              fontWeight: '600',
              marginTop: '0.6em',
              marginBottom: '0.3em',
              lineHeight: '1.4',
            },
            'p': {
              marginTop: '0',
              marginBottom: '1em',
              lineHeight: '1.6',
            },
            'ul, ol': {
              marginTop: '0',
              marginBottom: '1em',
              paddingLeft: '1.5em',
            },
            'li': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
          },
        },
        lg: {
          css: {
            fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
            lineHeight: '1.6',
            fontSize: '1.05rem',
            'h1': {
              fontSize: '2em',
              fontWeight: '700',
              marginTop: '1.2em',
              marginBottom: '0.6em',
              lineHeight: '1.3',
            },
            'h2': {
              fontSize: '1.5em',
              fontWeight: '600',
              marginTop: '1em',
              marginBottom: '0.5em',
              lineHeight: '1.3',
            },
            'h3': {
              fontSize: '1.25em',
              fontWeight: '600',
              marginTop: '0.8em',
              marginBottom: '0.4em',
              lineHeight: '1.4',
            },
            'h4': {
              fontSize: '1em',
              fontWeight: '600',
              marginTop: '0.6em',
              marginBottom: '0.3em',
              lineHeight: '1.4',
            },
            'p': {
              marginTop: '0',
              marginBottom: '1em',
              lineHeight: '1.6',
            },
            'ul, ol': {
              marginTop: '0',
              marginBottom: '1em',
              paddingLeft: '1.5em',
            },
            'li': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
