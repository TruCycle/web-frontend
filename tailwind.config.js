import { text } from 'stream/consumers'

/** @type {import('tailwindcss').Config} */
const sharedColors = {
  white: '#FFFFFF',
  accentGreen: '#A4F5A6',
  neutral900: '#222222',
  slate200: '#E2E8F0',
  slate500: '#64748B',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tc: {
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
            page: sharedColors.white,
            panel: sharedColors.white,
            heroText: '#E8F2E9',
            heroBrand: '#F3F8F4',
            heroTitle: '#F4F4F4',
            heroAccent: sharedColors.accentGreen,
            bullet: '#8FDC99',
            testimonialBorder: '#8FDD98',
            avatarText: '#203127',
            author: '#EFF5F0',
            authorRole: '#ADBEAF',
            quote: '#E8EFE8',
            meta: '#A9BAAB',
            formTitle: sharedColors.neutral900,
            formText: '#22222299',
            label: sharedColors.neutral900,
            inputBorder: '#CBD5E1',
            inputPlaceholder: sharedColors.slate500,
            inputFocus: '#84D68F',
            inputFocusRing: '#85D58F33',
            icon: '#5C6473',
            submit: '#95E69E',
            submitText: sharedColors.neutral900,
            submitFocus: '#50505080',
            row: sharedColors.neutral900,
            link: '#15A119',
            muted: sharedColors.slate500,
          },
          action: {
            primary: '#0D3B24',
            primaryHover: '#0a2e1c',
            primaryText: '#FFFFFF',
            primaryRing: '#0D3B2440',
            secondaryText: '#4B5563',
            secondaryRing: sharedColors.slate200,
          },
        },
      },
      backgroundImage: {
        'tc-auth-hero':
          'radial-gradient(circle at 25% 20%, #2d313620 0%, transparent 42%), linear-gradient(145deg, #1a1d21 0%, #121417 100%)',
        'tc-auth-card':
          'linear-gradient(160deg, #ffffff1a 0%, #ffffff0f 100%)',
        'tc-auth-avatar':
          'linear-gradient(160deg, #f3d2b4 0%, #f6efff 100%)',
      },
      boxShadow: {
        'tc-auth-card': '0 0 28px #8fde9924',
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
