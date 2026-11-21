// TruCycle palette: charcoal and mint (approved 21 Nov 2026).
// Token names are stable. Change a value here and every screen follows.
const brand = {
  // Charcoal: side menu, primary buttons, strong surfaces.
  deep: '#232323',
  hover: '#333333',
  // Mint: the one accent. Dark text (`onMint`) sits on it.
  mint: '#8EE3A8',
  mintHover: '#7AD897',
  onMint: '#0B1F16',
  // Pale mint: tinted cards, selected rows, soft badges.
  mintSoft: '#DDF4E3',
  mintLine: '#A9D9B9',
  // Page tint and surfaces.
  haze: '#F7FBF4',
  surface: '#FFFFFF',
  soft: '#F0F3ED',
  track: '#B4BFB8',
  // Text, strongest to quietest. All pass 4.5:1 on white and on the page tint.
  ink: '#0F1510',
  body: '#4A554C',
  muted: '#5C6B63',
  link: '#232323',
  // Lines: hairline for cards, control for inputs and outline buttons.
  line: '#E6EAE4',
  control: '#87928A',
  // Text and lines on charcoal.
  onDeep: '#C9CEC9',
  deepLine: '#3D3D3D',
  // Errors and destructive actions.
  danger: '#B3261E',
  dangerSoft: '#FBEDEC',
  dangerLine: '#E5B4B0',
}

// Tailwind's own grey and green scales are used all over the app. They are
// re-pointed at the TruCycle palette so that older screens match without
// each class name being rewritten.
const neutralScale = {
  50: brand.haze,
  100: brand.soft,
  200: brand.line,
  300: '#C9D3CD',
  400: '#6A776F',
  500: brand.muted,
  600: brand.body,
  700: '#333B35',
  800: brand.deep,
  900: brand.ink,
  950: brand.ink,
}
const mintScale = {
  50: '#F1FAF3',
  100: brand.mintSoft,
  200: '#C4EBCF',
  300: brand.mintLine,
  400: brand.mint,
  500: '#5FCB82',
  600: '#2F8F55',
  700: '#1F6B3F',
  800: '#17512F',
  900: brand.onMint,
  950: brand.onMint,
}
const dangerScale = {
  50: brand.dangerSoft,
  100: '#F7DAD7',
  200: brand.dangerLine,
  300: '#D98C86',
  400: '#C8554D',
  500: brand.danger,
  600: brand.danger,
  700: '#8C1D18',
  800: '#6F1713',
  900: '#52110E',
  950: '#3A0C0A',
}

/** @type {import('tailwindcss').Config} */
const sharedColors = {
  accentGreen: brand.mint,
  slate200: brand.line,
  slate500: brand.muted,
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: neutralScale,
        gray: neutralScale,
        zinc: neutralScale,
        neutral: neutralScale,
        lime: mintScale,
        emerald: mintScale,
        green: mintScale,
        rose: dangerScale,
        red: dangerScale,
        tc: {
          brand,
          app: {
            canvas: brand.haze,
            primary: sharedColors.accentGreen,
            secondary: brand.body,
            text: brand.ink,
            slate500: sharedColors.slate500,
            badgeOutline: brand.control,
            badgeText: brand.muted,
          },
          shell: {
            bg: brand.deep,
            active: brand.hover,
            divider: brand.deepLine,
            toggle: brand.hover,
            accent: sharedColors.accentGreen,
            accentHover: brand.mintHover,
            notify: '#FF9C2D',
            danger: brand.danger,
            roleText: brand.onDeep,
            roleActiveText: brand.onMint,
            dashboardBg: brand.haze,
          },
          header: {
            border: sharedColors.slate200,
            divider: brand.line,
            avatar: brand.deep,
            text: brand.ink,
            labelText: brand.muted,
          },
          auth: {
            page: brand.surface,
            panel: brand.surface,
            heroText: brand.onDeep,
            heroBrand: brand.surface,
            heroTitle: brand.surface,
            heroAccent: brand.mint,
            bullet: brand.mint,
            testimonialBorder: brand.mint,
            avatarText: brand.onMint,
            author: brand.surface,
            authorRole: brand.onDeep,
            quote: brand.onDeep,
            meta: brand.onDeep,
            formTitle: brand.ink,
            formText: brand.body,
            label: brand.ink,
            inputBorder: brand.control,
            inputPlaceholder: brand.muted,
            inputFocus: brand.deep,
            inputFocusRing: brand.mintSoft,
            icon: brand.muted,
            submit: brand.deep,
            submitText: brand.surface,
            submitFocus: brand.deep,
            row: brand.ink,
            link: brand.link,
            muted: brand.muted,
          },
          action: {
            primary: brand.deep,
            primaryHover: brand.hover,
            primaryText: brand.surface,
            primaryRing: `${brand.deep}40`,
            secondaryText: brand.deep,
            secondaryRing: brand.control,
          },
        },
      },
      backgroundImage: {
        'tc-auth-card':
          'linear-gradient(160deg, #ffffff1a 0%, #ffffff0f 100%)',
      },
      boxShadow: {
        'tc-auth-card': `0 0 28px ${brand.mint}24`,
        'tc-role-active':
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        // Card at rest, raised control, floating button on hover, dialog.
        'tc-card': '0 4px 12px rgba(10,13,10,.06), 0 2px 4px rgba(10,13,10,.04)',
        'tc-raised': '0 6px 16px rgba(10,13,10,.14), 0 2px 4px rgba(10,13,10,.08)',
        'tc-float': '0 8px 20px rgba(10,13,10,.16), 0 2px 6px rgba(10,13,10,.08)',
        'tc-dialog': '0 24px 64px rgba(10,13,10,.25)',
        // Mint halo round the avatar and other "this is you" marks.
        'tc-halo': `0 0 0 2px ${brand.surface}, 0 0 0 4px ${brand.mint}`,
      },
      borderRadius: {
        // 8 chips and small controls, 12 buttons and inputs, 18 cards, 24 panels.
        'tc-sm': '8px',
        'tc-md': '12px',
        'tc-lg': '18px',
        'tc-xl': '24px',
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
