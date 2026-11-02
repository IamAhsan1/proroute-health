import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import {
  Stethoscope,
  BadgeCheck,
  CalendarClock,
  Calendar,
  FileText,
  MessageSquare,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { DashboardShell, NavGroup } from '../components/DashboardShell';
import { DropdownMenuItem } from '../components/ui';

interface DoctorLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const DoctorLayout: React.FC<DoctorLayoutProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const getBreadcrumbTitle = () => {
    if (location.pathname.includes('/doctor/dashboard')) return 'Doctor Workspace Overview';
    if (location.pathname.includes('/doctor/profile')) return 'Medical Credentials & Licensure';
    if (location.pathname.includes('/doctor/schedule')) return 'Availability Schedule Builder';
    if (location.pathname.includes('/doctor/appointments')) return 'Patient Consultation Queue';
    if (location.pathname.includes('/doctor/documents')) return 'Patient Records & Documents';
    if (location.pathname.includes('/doctor/chat')) return 'Live Telehealth Consultations';
    return 'Doctor Dashboard';
  };

  const doctorDisplayName = currentUser?.email
    ? `Dr. ${currentUser.email.split('@')[0]}`
    : 'Dr. Practitioner';

  const navGroups: NavGroup[] = [
    {
      heading: 'Clinical Core',
      items: [
        {
          to: '/doctor/dashboard',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
        },
        {
          to: '/doctor/schedule',
          label: 'Availability Schedule',
          icon: CalendarClock,
        },
        {
          to: '/doctor/profile',
          label: 'Medical Credentials',
          icon: BadgeCheck,
        },
        {
          to: '/doctor/appointments',
          label: 'Consultation Queue',
          icon: Calendar,
        },
      ],
    },
    {
      heading: 'Telehealth & Records',
      items: [
        {
          to: '/doctor/documents',
          label: 'Clinical Documents',
          icon: FileText,
        },
        {
          to: '/doctor/chat',
          label: 'Live Patient Chat',
          icon: MessageSquare,
        },
      ],
    },
  ];

  return (
    <DashboardShell
      brandName="ProRoute"
      brandTag="DOCTOR"
      brandIcon={Stethoscope}
      brandColorClass="text-secondary"
      portalName="Doctor Workspace"
      breadcrumbTitle={getBreadcrumbTitle()}
      storageKey="proroute-sidebar-collapsed"
      currentUser={currentUser}
      userDisplayName={doctorDisplayName}
      userRoleBadge="Physician"
      userRoleBadgeVariant="doctor"
      extraBadgeText={currentUser?.isEmailVerified ? 'Verified' : undefined}
      extraBadgeIcon={BadgeCheck}
      userSecurityNotice="Verified Clinical Session"
      navGroups={navGroups}
      showPublicDirectoryLink={true}
      publicDirectoryLabel="Public Directory"
      onLogout={onLogout}
      profileDropdownItems={
        <>
          <DropdownMenuItem asChild>
            <Link to="/doctor/profile" className="flex items-center gap-2 w-full">
              <BadgeCheck className="w-3.5 h-3.5 text-secondary" />
              Credentials & Profile
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

export default DoctorLayout;
