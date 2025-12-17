import React from 'react';
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSection,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Tooltip,
  Spinner,
} from '@patternfly/react-core';
import {
  GithubIcon,
} from '@patternfly/react-icons';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
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
import { clusterAPI } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

const AppContent: React.FC = () => {
  const { isDarkTheme, toggleTheme } = useThemeStore();

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => clusterAPI.getAuthStatus(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const isAuthenticated = authStatus?.authenticated === true;

  const headerTools = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignEnd' }}>
          {isAuthenticated && (
            <>
              <ToolbarItem>
                <RegistryStatus />
              </ToolbarItem>
              <ToolbarItem>
                <div style={{ 
                  width: '1px', 
                  height: '24px', 
                  background: 'var(--pf-t--global--border--color--default)',
                  margin: '0 8px'
                }} />
              </ToolbarItem>
            </>
          )}
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
                  <span style={{ color: 'var(--pf-t--global--color--nonstatus--orange--default)' }}>☀️</span> : 
                  <span style={{ color: 'var(--pf-t--global--color--brand--default)' }}>🌙</span>
                }
              />
            </Tooltip>
          </ToolbarItem>
          <ToolbarItem>
            {authLoading ? (
              <Spinner size="md" />
            ) : (
              <UserMenu />
            )}
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const masthead = (
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
    <div className="app">
      <Page masthead={masthead}>
        <PageSection className="pf-v6-u-p-0">
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
            background: 'var(--pf-t--global--background--color--primary--default)',
            color: 'var(--pf-t--global--text--color--regular)',
            border: '1px solid var(--pf-t--global--border--color--default)',
            borderRadius: 'var(--pf-t--global--border--radius--medium)',
            boxShadow: 'var(--pf-t--global--box-shadow--lg)',
          },
          success: {
            iconTheme: {
              primary: 'var(--pf-t--global--color--status--success--default)',
              secondary: 'var(--pf-t--global--background--color--primary--default)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--pf-t--global--color--status--danger--default)',
              secondary: 'var(--pf-t--global--background--color--primary--default)',
            },
          },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
