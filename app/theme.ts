'use client'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A80F0',
      dark: '#1967D2',
      light: '#AECBFA',
    },
    background: {
      default: '#1A1B1E',
      paper: '#2C2D30',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#9AA0A6',
      disabled: '#5F6368',
    },
    secondary: {
      main: '#9AA0A6',
      dark: '#E8EAED',
      light: '#5F6368',
    },
    error: { main: '#F28B82' },
    info: { main: '#89B4F8' },
    success: { main: '#81C995' },
    warning: { main: '#FDD663' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 16,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    h1: { fontSize: '4.5rem', fontWeight: 500 },
    h2: { fontSize: '3rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9rem', fontWeight: 400, lineHeight: 1.3 },
    caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2 },
  },
  shape: {
    borderRadius: 12,
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
  },
})

export default theme;
