import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ["var(--font-nunito)"],
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			   puce: { DEFAULT: '#d88c9a', 100: '#351219', 200: '#6a2431', 300: '#a0374a', 400: '#c6586c', 500: '#d88c9a', 600: '#e0a4af', 700: '#e8bbc3', 800: '#efd1d7', 900: '#f7e8eb' },
  			   melon: { DEFAULT: '#e5aea2', 100: '#3d1911', 200: '#7b3323', 300: '#b84c34', 400: '#d47a66', 500: '#e5aea2', 600: '#eabfb6', 700: '#f0cfc8', 800: '#f5dfda', 900: '#faefed' },
  			   light_orange: { DEFAULT: '#f2d0a9', 100: '#482b0b', 200: '#905715', 300: '#d88220', 400: '#e8aa63', 500: '#f2d0a9', 600: '#f5dabc', 700: '#f7e3cc', 800: '#faeddd', 900: '#fcf6ee' },
  			   champagne: { DEFAULT: '#f2dabe', 100: '#482d0e', 200: '#915b1d', 300: '#d6882e', 400: '#e4b177', 500: '#f2dabe', 600: '#f5e2cc', 700: '#f7e9d9', 800: '#faf0e5', 900: '#fcf8f2' },
  			   almond: { DEFAULT: '#f1e3d3', 100: '#452f16', 200: '#8a5e2c', 300: '#c68c4a', 400: '#dcb88f', 500: '#f1e3d3', 600: '#f4e9dd', 700: '#f7efe5', 800: '#faf4ee', 900: '#fcfaf6' },
  			   ash_gray: { DEFAULT: '#c5d2c6', 100: '#232e24', 200: '#475c49', 300: '#6a8a6d', 400: '#97af99', 500: '#c5d2c6', 600: '#d1dcd2', 700: '#dce4dd', 800: '#e8ede8', 900: '#f3f6f4' },
  			   cambridge_blue: { DEFAULT: '#99c1b9', 100: '#1a2b28', 200: '#35564f', 300: '#4f8177', 400: '#6fa79b', 500: '#99c1b9', 600: '#aecdc7', 700: '#c2dad5', 800: '#d7e6e3', 900: '#ebf3f1' },
  			   cadet_gray: { DEFAULT: '#97b0bb', 100: '#1b2429', 200: '#354951', 300: '#506d7a', 400: '#6d91a0', 500: '#97b0bb', 600: '#abbfc8', 700: '#c0cfd6', 800: '#d5dfe4', 900: '#eaeff1' },
  			   cool_gray: { DEFAULT: '#949fbc', 100: '#1a1e29', 200: '#343c53', 300: '#4e5a7c', 400: '#6b7aa2', 500: '#949fbc', 600: '#aab2ca', 700: '#bfc5d7', 800: '#d4d9e4', 900: '#eaecf2' },
  			   tropical_indigo: { DEFAULT: '#8e7dbe', 100: '#1b152a', 200: '#362a54', 300: '#50407e', 400: '#6b55a8', 500: '#8e7dbe', 600: '#a698cb', 700: '#bcb2d8', 800: '#d2cbe5', 900: '#e9e5f2' }
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  	}
  },
  plugins: [tailwindAnimate],
};
export default config;
