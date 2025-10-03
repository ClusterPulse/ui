import React from 'react';
import { useEffect } from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Button,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Tooltip,
} from '@patternfly/react-core';
import {
  GithubIcon,
} from '@patternfly/react-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import '@patternfly/react-core/dist/styles/base.css';
import './styles/app.scss';
import Logo from './assets/logo.svg?react';

// Components
import { ClusterDashboard } from './components/ClusterDashboard';
import { UserMenu } from './components/UserMenu';
import { RegistryStatus } from './components/RegistryStatus';
import { useThemeStore } from './stores/themeStore';

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes  
      refetchOnWindowFocus: true,
    },
  },
});

const App: React.FC = () => {
  const { isDarkTheme, toggleTheme } = useThemeStore();

  const headerTools = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup variant="icon-button-group" align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <RegistryStatus />
          </ToolbarItem>
          <ToolbarItem>
            <div style={{ 
              width: '1px', 
              height: '24px', 
              background: 'var(--pf-v5-global--BorderColor--100)',
              margin: '0 8px'
            }} />
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant="plain"
              aria-label="GitHub"
              component="a"
              href="https://github.com/ClusterPulse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Tooltip content={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}>
              <Button
                variant="plain"
                aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={toggleTheme}
                icon={isDarkTheme ? 
                  <span style={{ color: 'var(--pf-v5-global--palette--gold-400)' }}>☀️</span> : 
                  <span style={{ color: 'var(--pf-v5-global--palette--blue-300)' }}>🌙</span>
                }
              />
            </Tooltip>
          </ToolbarItem>
          <ToolbarItem>
            <UserMenu />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const header = (
    <Masthead>
      <MastheadMain>
        <MastheadBrand>
          <Logo 
            className="app-logo"
            style={{
              height: '70px',
              width: 'auto',
              marginLeft: '0rem',
              marginRight: '1rem'
            }}
          />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerTools}</MastheadContent>
    </Masthead>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Page header={header}>
          <PageSection variant={PageSectionVariants.light} className="pf-v5-u-p-0">
            <AnimatePresence mode="wait">
              <ClusterDashboard />
            </AnimatePresence>
          </PageSection>
        </Page>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--pf-v5-global--BackgroundColor--100)',
              color: 'var(--pf-v5-global--Color--100)',
              border: '1px solid var(--pf-v5-global--BorderColor--100)',
              borderRadius: 'var(--pf-v5-global--BorderRadius--md)',
              boxShadow: 'var(--pf-v5-global--BoxShadow--lg)',
            },
            success: {
              iconTheme: {
                primary: 'var(--pf-v5-global--success-color--100)',
                secondary: 'var(--pf-v5-global--BackgroundColor--100)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--pf-v5-global--danger-color--100)',
                secondary: 'var(--pf-v5-global--BackgroundColor--100)',
              },
            },
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </div>
    </QueryClientProvider>
  );
};

export default App;
