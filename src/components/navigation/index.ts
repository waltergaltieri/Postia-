export { default as NavigationSidebar } from './navigation-sidebar'
export { default as Breadcrumbs, useBreadcrumbs } from './breadcrumbs'
export { default as ClientSelector } from './client-selector'
export { default as AdminDashboardToggle } from './admin-dashboard-toggle'
export { default as ClientSelectorDemo } from './client-selector-demo'
export { 
  NavigationProvider, 
  useNavigation, 
  useCurrentClient, 
  useClients, 
  useWorkflowProgress,
  useClientManagement,
  useClientPermissions,
  useClientSession,
  useRecentClients
} from './navigation-context'