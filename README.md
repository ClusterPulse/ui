# ClusterPulse Frontend Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Styling & Theming](#styling--theming)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

ClusterPulse Frontend is a modern React-based dashboard for monitoring OpenShift/Kubernetes clusters. Built with TypeScript and PatternFly (Red Hat's design system), it provides real-time visibility into cluster health, resources, nodes, and operators.

### Key Features
- **Real-time cluster monitoring** with 30-second auto-refresh
- **Multi-cluster support** with individual health indicators
- **Node management** with detailed resource utilization
- **Operator visibility** across namespaces
- **RBAC integration** with OAuth2 proxy authentication
- **Dark/Light theme** with persistent preferences
- **Responsive design** optimized for various screen sizes
- **Container registry status** monitoring

### Technology Stack
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **PatternFly** - Red Hat design system
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **SCSS** - Styling

## Architecture

### High-Level Overview
```
┌─────────────────────────────────────┐
│         ClusterPulse Frontend       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │        App Component        │    │
│  └────────────┬────────────────┘    │
│               │                     │
│  ┌────────────▼────────────────┐    │
│  │    ClusterDashboard         │    │
│  └────────────┬────────────────┘    │
│               │                     │
│  ┌────────────▼────────────────┐    │
│  │  Components (Cards, Modals) │    │
│  └────────────┬────────────────┘    │
│               │                     │
│  ┌────────────▼────────────────┐    │
│  │     API Service Layer       │    │
│  └─────────────────────────────┘    │
│                                     │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   Backend API        │
    │   /api/v1/*          │
    └──────────────────────┘
```

### Component Hierarchy
```
App
├── QueryClientProvider
├── Masthead (Header)
│   ├── Logo
│   ├── RegistryStatus
│   ├── ThemeToggle
│   └── UserMenu
└── ClusterDashboard
    ├── ClusterStats
    ├── Toolbar (Search/Filter)
    └── ClusterGrid
        └── ClusterCard[]
            ├── NodeDetailsModal
            └── OperatorsView
```

## Getting Started

### Prerequisites
- Node.js and npm/yarn
- Access to the backend API (development or production)

### Installation
```bash
# Clone the repository
git clone https://github.com/ClusterPulse/ui.git

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure API endpoint
# Edit .env and set VITE_API_URL to your backend
```

### Development Setup
```bash
# Start development server (default port: 3000)
npm start

# The proxy in vite.config.ts will forward /api requests
# to the backend specified in VITE_BACKEND_URL
```

### Environment Variables
```env
# API Configuration
VITE_API_URL=http://192.168.1.5:8000/api/v1  # Backend API URL
VITE_BACKEND_URL=http://localhost:8080       # Proxy target for dev

# Feature Flags
VITE_ENABLE_DEVTOOLS=true                    # Enable React Query devtools
VITE_ENABLE_MOCK_DATA=false                  # Use mock data (future)

# Environment
VITE_ENVIRONMENT=development                 # development | staging | production
```

## Project Structure

```
frontend/
├── public/                    # Static assets
│   └── site.webmanifest      # PWA manifest
├── src/
│   ├── assets/               # Images, icons, logos
│   │   └── logo.svg
│   ├── components/           # React components
│   │   ├── ClusterCard.tsx
│   │   ├── ClusterDashboard.tsx
│   │   ├── ClusterGrid.tsx
│   │   ├── ClusterStats.tsx
│   │   ├── NodeDetailsModal.tsx
│   │   ├── OperatorsView.tsx
│   │   ├── RegistryStatus.tsx
│   │   ├── UserMenu.tsx
│   │   └── icons/
│   │       └── OpenShiftIcon.tsx
│   ├── services/             # API services
│   │   └── api.ts
│   ├── stores/               # State management
│   │   └── themeStore.ts
│   ├── styles/               # Global styles
│   │   ├── app.scss
│   │   └── index.css
│   ├── types/                # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx               # Root component
│   └── index.tsx             # Entry point
├── .eslintrc.json            # ESLint configuration
├── .env.example              # Environment template
├── Dockerfile.frontend       # Container image
├── index.html                # HTML template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── vite.config.ts            # Vite configuration
```

## Core Components

### ClusterDashboard
The main dashboard container that orchestrates the cluster monitoring interface.

**Responsibilities:**
- Fetches cluster data via React Query
- Manages search and filtering state
- Renders statistics overview
- Coordinates the cluster grid layout

**Key Props:** None (top-level component)

**Usage:**
```tsx
// Automatically rendered by App component
<ClusterDashboard />
```

### ClusterCard
Individual cluster representation with health status, metrics, and actions.

**Features:**
- Health status indicator (colored border)
- Resource utilization (CPU, Memory, Storage)
- Quick stats (Nodes, Namespaces, Pods)
- Action menu (View Details, Nodes, Operators)
- Version and channel badges
- Console link

**Props:**
```typescript
interface ClusterCardProps {
  cluster: any;              // Cluster data object
  onRefresh: () => void;    // Refresh callback
  onNodeClick: () => void;  // Node modal trigger
  onOperatorsClick: () => void; // Operators modal trigger
  permissions?: any;        // User permissions (optional)
}
```

### NodeDetailsModal
Displays detailed node information with filtering and search capabilities.

**Features:**
- Node status filtering (Ready, NotReady, SchedulingDisabled)
- Role-based filtering
- Search by node name
- Expandable node details
- Resource usage visualization
- System information display

**Props:**
```typescript
interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: {
    name: string;
    displayName?: string;
    version?: string;
    platform?: string;
  } | null;
}
```

### OperatorsView
Modal for viewing installed operators and their status.

**Features:**
- Operator health status
- Namespace distribution
- Provider information
- Version details
- Search functionality

### RegistryStatus
Header component showing container registry availability.

**Features:**
- Real-time registry health
- Click for detailed status
- Error details on hover

## API Integration

### Service Layer (`services/api.ts`)

The API service provides a centralized interface for backend communication:

```typescript
class APIClient {
  // Authentication
  getAuthStatus()      // Check authentication status
  getCurrentUser()     // Get current user info
  getUserPermissions() // Get RBAC permissions
  logout()            // Logout user

  // Clusters
  getClusters()       // List all clusters
  getCluster(name)    // Get cluster details
  getClusterNodes()   // Get cluster nodes
  getClusterOperators() // Get operators
  getClusterMetrics() // Get resource metrics
  
  // Registries
  getRegistriesStatus() // Get registry health
}
```

### Authentication Flow
1. OAuth2 proxy handles authentication
2. Cookies maintain session state
3. API calls include credentials automatically
4. 401 responses redirect to login

### Error Handling
- Network errors show toast notifications
- 401 errors trigger re-authentication
- 403 errors show permission denied message
- API errors are logged to console

## State Management

### Theme Store (Zustand)
Located in `stores/themeStore.ts`, manages dark/light theme preferences.

```typescript
interface ThemeState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}
```

### Query State (React Query)
Data fetching and caching managed by TanStack Query:

```typescript
// Example: Fetching clusters
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['clusters'],
  queryFn: () => clusterAPI.getClusters(),
  refetchInterval: 30000, // 30 seconds
});
```

**Cache Configuration:**
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `retry`: 3 attempts
- `refetchOnWindowFocus`: true

## Styling & Theming

### Design System
PatternFly 5 provides the base design system with Red Hat branding.

### Theme Implementation
1. **CSS Variables**: PatternFly CSS custom properties
2. **Dark Mode**: `.pf-v5-theme-dark` class on `<html>`
3. **Custom Styles**: SCSS in `styles/app.scss`

### Color Palette
```scss
// Health Status Colors
--cluster-healthy: #5ba352;    // Green
--cluster-degraded: #f0ab00;   // Orange
--cluster-unhealthy: #c9190b;  // Red
--cluster-unknown: #8a8d90;    // Grey

// Brand Colors
--professional-blue: #0066cc;
--professional-dark: #151515;
```

### Component Styling Guidelines
1. Use PatternFly components when available
2. Apply utility classes for spacing: `pf-v5-u-*`
3. Custom styles in component-specific classes
4. Maintain consistent spacing: 8px grid system
5. Ensure dark mode compatibility

## Testing

### Unit Testing (Future Implementation)
```typescript
// Example test structure
describe('ClusterCard', () => {
  it('should display cluster name', () => {
    render(<ClusterCard cluster={mockCluster} />);
    expect(screen.getByText('test-cluster')).toBeInTheDocument();
  });
  
  it('should show health status', () => {
    // Test implementation
  });
});
```

### E2E Testing Considerations
- Test critical user flows
- Verify authentication flow
- Test cluster interactions
- Validate modal behaviors

## Deployment

### Building for Production
```bash
# Build optimized production bundle
npm run build

# Output in ./build directory
# Static assets ready for deployment
```

### Resources
- [PatternFly Documentation](https://www.patternfly.org/v5/)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
