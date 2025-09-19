import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Database, 
  Plus, 
  Users, 
  BarChart3,
  Youtube,
  LogOut,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navigationItems = [
    {
      title: 'Датасеты',
      url: '/',
      icon: Database,
      roles: [UserRole.ADMIN, UserRole.ANNOTATOR, UserRole.VIEWER],
    },
    {
      title: 'Создать новый',
      url: '/create-dataset',
      icon: Plus,
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      title: 'Пользователи',
      url: '/users',
      icon: Users,
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      title: 'Статистика',
      url: '/statistics',
      icon: BarChart3,
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  
  const getNavClassName = (isActiveItem: boolean) =>
    isActiveItem 
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  const visibleItems = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return item.roles.includes(user?.role as UserRole);
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-3 p-4">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Youtube className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate">
                YouTube Data
              </h1>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                Админ панель
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-medium">
            {!isCollapsed ? 'Навигация' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {isActive(item.url) && (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-3">
          {/* User Info */}
          {!isCollapsed && user && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.username}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {user.role}
              </p>
            </div>
          )}
          
          {/* Logout Button */}
          <Button
            variant="secondary"
            size={isCollapsed ? "sm" : "default"}
            onClick={handleLogout}
            className="w-full justify-start bg-sidebar-accent hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2">Выйти</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;