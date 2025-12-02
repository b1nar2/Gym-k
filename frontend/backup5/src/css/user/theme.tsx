import { createTheme } from '@mui/material/styles';

const primaryColor = '#5ae048';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryColor,
      contrastText: '#fff',
    },
    background: {
      default: '#ffffff',
      paper: '#f9fafb',
    },
    text: {
      primary: '#3f3f46',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "sans-serif"',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          '&:hover': {
            // backgroundColor: '#16a34a',
            boxShadow: '0 6px 12px -1px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.07)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        },
      },
    },
  },
});

export default theme;
