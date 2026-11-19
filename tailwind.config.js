const brand = {
  deep: '#0F2A1E',
  mint: '#68C89B',
  haze: '#EEF8F2',
  surface: '#FFFFFF',
  ink: '#1E1E1E',
  muted: '#5C6B63',
  link: '#3D7A52',
  line: '#E4E7E4',
  control: '#6F8176',
  hover: '#214937',
}

/** @type {import('tailwindcss').Config} */
const sharedColors = {
  accentGreen: '#A4F5A6',
  slate200: '#E2E8F0',
  slate500: '#64748B',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tc: {
          brand,
          app: {
            canvas: '#F8FAFC',
            primary: sharedColors.accentGreen,
            secondary: '#121212B3',
            text: '#172033',
            slate500: sharedColors.slate500,
            badgeOutline: '#22222299',
            badgeText: '#12121299',
          },
          shell: {
            bg: '#232323',
            active: '#333333',
            divider: '#64748B80',
            toggle: '#2F382F',
            accent: sharedColors.accentGreen,
            accentHover: '#8EEA93',
            notify: '#FF9C2D',
            danger: '#F43F5E',
            roleText: '#A1A1AA',
            roleActiveText: '#121212',
            dashboardBg: '#F8FAFC',
          },
          header: {
            border: sharedColors.slate200,
            divider: '#CBD5E1',
            avatar: '#16A34A',
            text: '#121212',
            labelText: '#12121299',
          },
          auth: {
            page: brand.surface,
            panel: brand.surface,
            heroText: brand.haze,
            heroBrand: brand.surface,
            heroTitle: brand.surface,
            heroAccent: brand.mint,
            bullet: brand.mint,
            testimonialBorder: brand.mint,
            avatarText: brand.deep,
            author: brand.surface,
            authorRole: brand.haze,
            quote: brand.haze,
            meta: brand.haze,
            formTitle: brand.deep,
            formText: brand.muted,
            label: brand.ink,
            inputBorder: brand.control,
            inputPlaceholder: brand.muted,
            inputFocus: brand.deep,
            inputFocusRing: brand.haze,
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
      },
      fontFamily: {
        sans: [
          'SF Pro',
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
