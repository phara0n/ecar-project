"use client"

import type * as React from "react"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { logout } from '@/store/slices/authSlice'
import {
  BarChartIcon,
  CarIcon,
  UsersIcon,
  WrenchIcon,
  FileTextIcon,
  PackageIcon,
  PenToolIcon as ToolIcon,
  SettingsIcon,
  HelpCircleIcon,
  SearchIcon,
  PlusCircleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <span className="text-base font-semibold">{t('sidebar.title')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip={t('sidebar.newService')}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <PlusCircleIcon />
                  <span>{t('sidebar.newService')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.dashboard')} asChild>
                  <Link to="/">
                    <LayoutDashboardIcon />
                    <span>{t('sidebar.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.vehicles')} asChild>
                  <Link to="/vehicles">
                    <CarIcon />
                    <span>{t('sidebar.vehicles')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.customers')} asChild>
                  <Link to="/customers">
                    <UsersIcon />
                    <span>{t('sidebar.customers')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.services')}>
                  <WrenchIcon />
                  <span>{t('sidebar.services')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.invoices')}>
                  <FileTextIcon />
                  <span>{t('sidebar.invoices')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.parts')}>
                  <PackageIcon />
                  <span>{t('sidebar.parts')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.mechanics')}>
                  <ToolIcon />
                  <span>{t('sidebar.mechanics')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.analytics')}>
                  <BarChartIcon />
                  <span>{t('sidebar.analytics')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.settings')}>
                  <SettingsIcon />
                  <span>{t('sidebar.settings')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.help')}>
                  <HelpCircleIcon />
                  <span>{t('sidebar.help')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('sidebar.search')}>
                  <SearchIcon />
                  <span>{t('sidebar.search')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="flex items-center justify-between">
          <SidebarMenuItem className="flex-grow">
            <SidebarMenuButton className="pointer-events-none">
              <span className="font-medium">{t('sidebar.user')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
                tooltip={t('sidebar.logout')}
                onClick={handleLogout} 
                className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <LogOutIcon />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

