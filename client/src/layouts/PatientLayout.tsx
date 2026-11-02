import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  Search,
  Sparkles,
} from 'lucide-react';
import { DashboardShell, NavGroup } from '../components/DashboardShell';
import { DropdownMenuItem } from '../components/ui';

interface PatientLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const getBreadcrumbTitle = () => {
    if (location.pathname.includes('/portal/dashboard')) return 'Care Dashboard & Overview';
    if (location.pathname.includes('/portal/appointments')) return 'My Scheduled Consultations';
    if (location.pathname.includes('/portal/records')) return 'Medical Records & Documents';
    if (location.pathname.includes('/portal/messages')) return 'Doctor Messages';
    if (location.pathname.includes('/portal/billing')) return 'Invoices & Receipts';
    return 'Patient Telehealth Portal';
  };

  const patientDisplayName =
    currentUser?.patient?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Patient');

  const navGroups: NavGroup[] = [
    {
      heading: 'Care & Consultations',
      items: [
        {
          to: '/portal/dashboard',
          label: 'Care Dashboard',
          icon: LayoutDashboard,
        },
        {
          to: '/portal/appointments',
          label: 'My Appointments',
          icon: Calendar,
        },
      ],
    },
    {
      heading: 'Medical Records & Care',
      items: [
        {
          to: '/portal/records',
          label: 'Health Documents',
          icon: FileText,
        },
        {
          to: '/portal/messages',
          label: 'Doctor Messages',
          icon: MessageSquare,
        },
        {
          to: '/portal/billing',
          label: 'Billing & Invoices',
          icon: CreditCard,
        },
      ],
    },
  ];

  return (
    <DashboardShell
      brandName="ProRoute"
      brandTag="HEALTH"
      brandIcon={HeartPulse}
      brandColorClass="text-primary"
      portalName="Patient Portal"
      breadcrumbTitle={getBreadcrumbTitle()}
      storageKey="proroute-patient-sidebar-collapsed"
      currentUser={currentUser}
      userDisplayName={patientDisplayName}
      userRoleBadge="Verified Patient"
      userRoleBadgeVariant="patient"
      extraBadgeText={currentUser?.isEmailVerified ? 'ID Verified' : undefined}
      extraBadgeIcon={Sparkles}
      userSecurityNotice="Protected Health Information"
      navGroups={navGroups}
      showPublicDirectoryLink={true}
      publicDirectoryLabel="Find a Doctor"
      onLogout={onLogout}
      profileDropdownItems={
        <>
          <DropdownMenuItem asChild>
            <Link to="/portal/dashboard" className="flex items-center gap-2 w-full">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              Care Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/doctors" className="flex items-center gap-2 w-full">
              <Search className="w-3.5 h-3.5 text-primary" />
              Browse Specialists
            </Link>
          </DropdownMenuItem>
        </>
      }
    />
  );
};

export default PatientLayout;
