import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import {
  ShieldAlert,
  ClipboardCheck,
  Stethoscope,
  Activity,
  CreditCard,
  History,
  Lock,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { DashboardShell, NavGroup } from '../components/DashboardShell';
import { DropdownMenuItem } from '../components/ui';

interface AdminLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const getBreadcrumbTitle = () => {
    if (location.pathname === '/admin' || location.pathname.includes('/admin/dashboard')) {
      return isSuperAdmin ? 'Super Admin Governance Overview' : 'Admin Dashboard Overview';
    }
    if (location.pathname.includes('/admin/verifications')) return 'Doctor Verification Queue';
    if (location.pathname.includes('/admin/specialties')) return 'Medical Specialties Directory';
    if (location.pathname.includes('/admin/bookings')) return 'Appointments & Bookings';
    if (location.pathname.includes('/admin/payments')) return 'Billing & Payouts';
    if (location.pathname.includes('/admin/audit')) return 'Compliance & Activity Logs';
    return isSuperAdmin ? 'Super Admin Console' : 'Admin Dashboard';
  };

  const navGroups: NavGroup[] = [
    {
      heading: 'Overview',
      items: [
        {
          to: '/admin/dashboard',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      heading: 'Medical Staff',
      items: [
        {
          to: '/admin/verifications',
          label: 'Doctor Verification Queue',
          icon: ClipboardCheck,
        },
        {
          to: '/admin/specialties',
          label: 'Medical Specialties',
          icon: Stethoscope,
        },
      ],
    },
    {
      heading: 'Platform Management',
      items: [
        {
          to: '/admin/bookings',
          label: 'Bookings & Appointments',
          icon: Activity,
        },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            heading: 'Super Admin Governance',
            items: [
              {
                to: '/admin/payments',
                label: 'Payment Settlements',
                icon: CreditCard,
              },
              {
                to: '/admin/audit',
                label: 'Compliance & Audit Logs',
                icon: History,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <DashboardShell
      brandName="ProRoute"
      brandTag={isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
      brandIcon={ShieldAlert}
      brandColorClass="text-primary"
      portalName={isSuperAdmin ? 'Super Admin Console' : 'Admin Console'}
      breadcrumbTitle={getBreadcrumbTitle()}
      storageKey="proroute-admin-sidebar-collapsed"
      currentUser={currentUser}
      userRoleBadge={isSuperAdmin ? 'Super Administrator' : 'Administrator'}
      userRoleBadgeVariant="admin"
      extraBadgeText={isSuperAdmin ? 'Root Governance' : 'Admin Access'}
      extraBadgeIcon={Lock}
      userSecurityNotice={isSuperAdmin ? 'Root Governance Session' : 'Verified Administrative Session'}
      navGroups={navGroups}
      showPublicDirectoryLink={true}
      publicDirectoryLabel="Public Directory"
      onLogout={onLogout}
      profileDropdownItems={
        <>
          <DropdownMenuItem asChild>
            <Link to="/admin/dashboard" className="flex items-center gap-2 w-full">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              Dashboard Overview
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/admin/verifications" className="flex items-center gap-2 w-full">
              <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
              Doctor Queue
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/admin/specialties" className="flex items-center gap-2 w-full">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              Specialties Taxonomy
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/doctors" className="flex items-center gap-2 w-full">
              <Search className="w-3.5 h-3.5 text-primary" />
              Public Directory
            </Link>
          </DropdownMenuItem>
        </>
      }
    />
  );
};

export default AdminLayout;
