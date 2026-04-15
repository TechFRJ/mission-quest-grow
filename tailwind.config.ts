import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '1rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
		fontFamily: {
			sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
			display: ['Space Grotesk', 'Inter', 'sans-serif'],
			mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			exp: {
  				DEFAULT: 'hsl(var(--exp))',
  				foreground: 'hsl(var(--exp-foreground))'
  			},
  			coin: {
  				DEFAULT: 'hsl(var(--coin))',
  				foreground: 'hsl(var(--coin-foreground))'
  			},
  			streak: {
  				DEFAULT: 'hsl(var(--streak))',
  				foreground: 'hsl(var(--streak-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 2px 8px -2px hsl(0 0% 0% / 0.08)',
  			medium: '0 4px 12px -2px hsl(0 0% 0% / 0.1)',
  			elevated: '0 8px 24px -4px hsl(0 0% 0% / 0.12)',
  			'glow-primary': '0 0 12px -4px hsl(var(--primary) / 0.3)',
  			'glow-streak': '0 0 12px -4px hsl(var(--streak) / 0.3)',
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(8px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				'0%': { transform: 'scale(0.95)', opacity: '0' },
  				'100%': { transform: 'scale(1)', opacity: '1' }
  			},
  			'slide-up': {
  				'0%': { transform: 'translateY(100%)' },
  				'100%': { transform: 'translateY(0)' }
  			},
  			'pulse-success': {
  				'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--success) / 0.3)' },
  				'50%': { boxShadow: '0 0 0 8px hsl(var(--success) / 0)' }
  			},
  			'bounce-coin': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-4px)' }
  			},
  			'fire-pulse': {
  				'0%, 100%': { transform: 'scale(1)', opacity: '1' },
  				'50%': { transform: 'scale(1.1)', opacity: '0.85' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.25s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'pulse-success': 'pulse-success 0.5s ease-out',
  			'bounce-coin': 'bounce-coin 0.3s ease-out',
  			'fire-pulse': 'fire-pulse 1.5s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
