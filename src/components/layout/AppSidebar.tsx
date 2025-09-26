import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Database, 
  Plus, 
  Users, 
  Youtube,
  LogOut,
  ChevronRight,
  ChevronUp,
  User,
}
from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);


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
    // {
    //   title: 'Статистика',
    //   url: '/statistics',
    //   icon: BarChart3,
    //   roles: [UserRole.ADMIN],
    //   adminOnly: true,
    // },
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
        <div className="flex items-center space-x-3 py-4 pl-0 ">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Youtube className="h-4 w-4 text-sidebar-primary-foreground" />
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
      <SidebarFooter className="border-t border-gray-800 bg-black">
        <div className="">
          {/* User Card */}
          {!isCollapsed && user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center space-x-3 p-3 bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">
                    {user.username}
                  </p>
                </div>
                <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-900 border border-gray-800 rounded-md shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Выйти</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Collapsed State */}
          {isCollapsed && user && (
            <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;