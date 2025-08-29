import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { ContextProvider } from './context/app-context';
import { AuthProvider } from './context/AuthProvider'; // <-- 1. 导入 AuthProvider
import './globals.css';

export const metadata = {
  title: 'CloudPuppy',
  description: 'Interface to generate & edit images using Google model Imagen',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body>
        <ContextProvider>
          <AuthProvider> {/* <-- 2. 在 ContextProvider 内部包裹 AuthProvider */}
            <AppRouterCacheProvider options={{ enableCssLayer: true }}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                {props.children}
              </ThemeProvider>
            </AppRouterCacheProvider>
          </AuthProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
