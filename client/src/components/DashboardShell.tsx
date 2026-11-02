import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import {
  LucideIcon,
  Search,
  LogOut,
  Bell,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  Menu,
  Globe,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Separator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Sheet,
  SheetContent,
} from './ui';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export interface DashboardShellProps {
  // Brand Configuration
  brandName?: string;
  brandTag: string; // e.g. "SEC-OPS" | "CLINICAL" | "HEALTH"
  brandIcon: LucideIcon;
  brandColorClass?: string; // e.g. "text-primary" | "text-secondary"

  // User Principal Configuration
  currentUser: UserProfile | null;
  userDisplayName?: string;
  userInitial?: string;
  userRoleBadge: string;
  userRoleBadgeVariant?: 'default' | 'secondary' | 'admin' | 'doctor' | 'patient';
  userSecurityNotice: string;
  extraBadgeText?: string;
  extraBadgeIcon?: LucideIcon;

  // Navigation Items
  storageKey: string;
  navGroups: NavGroup[];
  showPublicDirectoryLink?: boolean;
  publicDirectoryLabel?: string;

  // Header & Breadcrumb
  portalName: string;
  breadcrumbTitle: string;

  // Actions
  onLogout: () => void;
  profileDropdownItems?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  brandName = 'ProRoute',
  brandTag,
  brandIcon: BrandIcon,
  brandColorClass = 'text-primary',
  currentUser,
  userDisplayName,
  userInitial,
  userRoleBadge,
  userRoleBadgeVariant = 'default',
  userSecurityNotice,
  extraBadgeText,
  extraBadgeIcon: ExtraBadgeIcon,
  storageKey,
  navGroups,
  showPublicDirectoryLink = true,
  publicDirectoryLabel = 'Public Directory',
  portalName,
  breadcrumbTitle,
  onLogout,
  profileDropdownItems,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  const displayName =
    userDisplayName ||
    currentUser?.patient?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'User');

  const initial =
    userInitial ||
    (displayName ? displayName.charAt(0).toUpperCase() : 'U');

  return (
    <div className="w-full h-screen overflow-hidden bg-background text-on-surface flex flex-col md:flex-row selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:flex h-full bg-surface-container-lowest border-r border-surface-container-highest/60 flex-col justify-between shrink-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="flex-1 min-h-0 flex flex-col no-scrollbar overflow-y-auto">
          {/* Header */}
          <div
            className={`border-b border-surface-container-highest/50 flex items-center min-h-[64px] transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between p-4'
            }`}
          >
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-10 h-10 rounded-xl bg-surface-container-high border border-surface-container-highest flex items-center justify-center shadow-sm hover:bg-surface-container-highest hover:scale-105 transition-all group shrink-0"
                title="Expand Sidebar"
              >
                <BrandIcon className={`w-5 h-5 ${brandColorClass} group-hover:scale-110 transition-transform`} />
              </Button>
            ) : (
              <>
                <Link to="/" className="flex items-center gap-2.5 group overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-surface-container-highest flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                    <BrandIcon className={`w-5 h-5 ${brandColorClass}`} />
                  </div>
                  <div className="flex flex-col min-w-0 transition-opacity duration-200">
                    <span className="font-headline font-black text-sm tracking-tight text-on-surface flex items-center gap-1.5 truncate">
                      {brandName}
                      <span className={`text-[9px] px-1.5 py-0.2 bg-surface-container-highest ${brandColorClass} font-mono rounded font-bold`}>
                        {brandTag}
                      </span>
                    </span>
                    <span className={`text-[10px] font-mono ${brandColorClass} font-semibold uppercase tracking-wider truncate`}>
                      {portalName}
                    </span>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 text-outline hover:text-on-surface shrink-0 hidden md:flex"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* User Identity Card */}
          <div className={`p-3 mx-2 my-2 rounded-2xl bg-surface-container/50 border border-surface-container-highest/50 flex flex-col gap-2 transition-all ${isCollapsed ? 'items-center px-1' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <Avatar className="h-9 w-9 border-surface-container-highest bg-surface-container-high text-on-surface shrink-0">
                <AvatarFallback className={`font-headline font-bold text-xs ${brandColorClass}`}>
                  {initial}
                </AvatarFallback>
              </Avatar>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-on-surface truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-mono text-outline truncate">
                    {currentUser?.email}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center justify-between pt-1">
                <Badge variant={userRoleBadgeVariant} className="text-[10px]">
                  {userRoleBadge}
                </Badge>
                {extraBadgeText && (
                  <span className={`flex items-center gap-1 text-[11px] font-medium ${brandColorClass}`}>
                    {ExtraBadgeIcon && <ExtraBadgeIcon className="w-3.5 h-3.5" />}
                    {extraBadgeText}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-2 flex flex-col gap-1">
            {navGroups.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                {group.heading && !isCollapsed && (
                  <span className="px-3 py-1 text-[11px] font-semibold text-on-surface-variant mt-1">
                    {group.heading}
                  </span>
                )}
                {group.items.map((item, itemIdx) => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-surface-container-high text-primary border border-surface-container-highest font-semibold shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`
                      }
                    >
                      <ItemIcon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
                {gIdx < navGroups.length - 1 && (
                  <div className="my-1.5">
                    <Separator />
                  </div>
                )}
              </React.Fragment>
            ))}

            {showPublicDirectoryLink && (
              <>
                <div className="my-1.5">
                  <Separator />
                </div>
                {!isCollapsed && (
                  <span className="px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                    Explore Healthcare
                  </span>
                )}
                <Link
                  to="/doctors"
                  title={publicDirectoryLabel}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors ${
                    isCollapsed ? 'justify-center px-0' : ''
                  }`}
                >
                  <Search className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{publicDirectoryLabel}</span>}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`border-t border-surface-container-highest/50 flex flex-col gap-2 shrink-0 ${isCollapsed ? 'p-2.5 items-center' : 'p-3'}`}>
          {!isCollapsed && (
            <div className="p-2 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-[10px] text-outline flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${brandColorClass} shrink-0`} />
              <span className="truncate">{userSecurityNotice}</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={onLogout}
            title="End Session"
            className={`flex items-center justify-center gap-2 text-xs font-semibold ${isCollapsed ? 'w-10 h-10 p-0 rounded-xl' : 'w-full'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>End Session</span>}
          </Button>
        </div>
      </aside>

      {/* 2. Main Canvas Shell (Independent Scroll Area) */}
      <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-surface-container-highest/50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="h-8 w-8 md:hidden text-outline hover:text-on-surface shrink-0 mr-1"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className={`${brandColorClass} font-semibold hidden sm:inline`}>{portalName}</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-on-surface font-semibold truncate max-w-[160px] sm:max-w-none">
                {breadcrumbTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/doctors">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2.5">
                <Search className={`w-3.5 h-3.5 ${brandColorClass}`} />
                <span className="hidden md:inline">Directory</span>
              </Button>
            </Link>

            <ThemeToggle />

            <Button variant="outline" size="icon" className="h-8 w-8 relative text-outline hover:text-on-surface">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-primary absolute top-1.5 right-1.5" />
            </Button>

            <div className="h-4 w-px bg-surface-container-highest" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-1.5 sm:px-2 hover:bg-surface-container-high/60 h-8">
                  <Avatar className="h-7 w-7 border-surface-container-highest bg-surface-container-high text-on-surface">
                    <AvatarFallback className={`text-[11px] font-bold ${brandColorClass}`}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-on-surface hidden sm:inline max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-outline" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account Session</DropdownMenuLabel>
                <div className="px-2.5 py-1.5 flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-on-surface truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-mono text-outline truncate">
                    {currentUser?.email}
                  </p>
                  <div className="mt-1">
                    <Badge variant={userRoleBadgeVariant} className="text-[9px]">
                      {userRoleBadge}
                    </Badge>
                  </div>
                </div>

                {profileDropdownItems && (
                  <>
                    <DropdownMenuSeparator />
                    {profileDropdownItems}
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center cursor-pointer text-xs">
                    <Globe className="w-3.5 h-3.5 mr-2 text-outline" />
                    Public Website
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-error focus:text-error focus:bg-error/15 cursor-pointer text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 min-h-0 w-full p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Navigation Drawer Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col justify-between">
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-surface-container-highest/50 flex items-center justify-between min-h-[64px]">
              <Link
                to="/"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2.5 group overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-surface-container-highest flex items-center justify-center shadow-md">
                  <BrandIcon className={`w-5 h-5 ${brandColorClass}`} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline font-black text-sm tracking-tight text-on-surface flex items-center gap-1.5 truncate">
                    {brandName}
                    <span className={`text-[9px] px-1.5 py-0.2 bg-surface-container-highest ${brandColorClass} font-mono rounded font-bold`}>
                      {brandTag}
                    </span>
                  </span>
                  <span className={`text-[10px] font-mono ${brandColorClass} font-semibold uppercase tracking-wider truncate`}>
                    {portalName}
                  </span>
                </div>
              </Link>
            </div>

            {/* Mobile User Card */}
            <div className="p-3 mx-2 my-2 rounded-2xl bg-surface-container/50 border border-surface-container-highest/50 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 border-surface-container-highest bg-surface-container-high text-on-surface shrink-0">
                  <AvatarFallback className={`font-headline font-bold text-xs ${brandColorClass}`}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-on-surface truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-mono text-outline truncate">
                    {currentUser?.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Badge variant={userRoleBadgeVariant} className="text-[9px]">
                  {userRoleBadge}
                </Badge>
                {extraBadgeText && (
                  <span className={`flex items-center gap-1 text-[10px] font-mono ${brandColorClass}`}>
                    {ExtraBadgeIcon && <ExtraBadgeIcon className="w-3.5 h-3.5" />}
                    {extraBadgeText}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="p-2 flex flex-col gap-1">
              {navGroups.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {group.heading && (
                    <span className="px-3 py-1 text-[11px] font-semibold text-on-surface-variant mt-1">
                      {group.heading}
                    </span>
                  )}
                  {group.items.map((item, itemIdx) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={itemIdx}
                        to={item.to}
                        onClick={() => setIsMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-surface-container-high text-primary border border-surface-container-highest font-semibold shadow-xs'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                          }`
                        }
                      >
                        <ItemIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                  {gIdx < navGroups.length - 1 && (
                    <div className="my-1.5">
                      <Separator />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {showPublicDirectoryLink && (
                <>
                  <div className="my-1.5">
                    <Separator />
                  </div>
                  <span className="px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                    Explore Healthcare
                  </span>
                  <Link
                    to="/doctors"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="truncate">{publicDirectoryLabel}</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-surface-container-highest/50 flex flex-col gap-2">
            <div className="p-2 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-[10px] text-outline flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${brandColorClass} shrink-0`} />
              <span className="truncate">{userSecurityNotice}</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsMobileOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>End Session</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

