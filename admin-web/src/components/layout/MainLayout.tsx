import React from 'react';
import { SiteHeader } from '@/components/site-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Sub-component to handle grid layout calculation based on sidebar state
const MainContentGrid: React.FC<MainLayoutProps> = ({ children }) => {
  const { state } = useSidebar(); // Get sidebar state (expanded/collapsed)

  return (
    // Use CSS Grid: Define columns based on sidebar state
    // When expanded: sidebar width + 1fr (fills remaining space)
    // When collapsed: icon sidebar width + 1fr
    <div 
      className={cn(
        "grid h-screen w-full",
        state === 'expanded' 
          ? "grid-cols-[var(--sidebar-width)_1fr]" 
          : "grid-cols-[var(--sidebar-width-icon)_1fr]"
      )}
    >
      {/* Sidebar occupies the first column - Needs to be always rendered for grid */}
      <AppSidebar className="flex flex-col" /> {/* Ensure sidebar is always flex */}
      
      {/* Main Content Area occupies the second column */}
      <div className="flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
        <SiteHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}

// MainLayout now just provides context and renders the grid layout
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <MainContentGrid>{children}</MainContentGrid>
    </SidebarProvider>
  );
};

export default MainLayout; 