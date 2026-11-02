import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Columns,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  X,
  Lock,
  LayoutDashboard,
  CalendarClock,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';

type PreviewMode = 'side-by-side' | 'light' | 'dark';

export const ThemePreviewPage: React.FC = () => {
  const [mode, setMode] = useState<PreviewMode>('side-by-side');
  const [activeStep, setActiveStep] = useState<number>(2);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [selectedRadio, setSelectedRadio] = useState<string>('video');
  const [checkboxState, setCheckboxState] = useState<{ pmdc: boolean; hipaa: boolean }>({
    pmdc: true,
    hipaa: false,
  });

  return (
    <div className="w-full min-h-screen bg-background text-on-surface transition-colors pb-24">
      {/* Sticky Theme Switcher & Toolbar */}
      <div className="sticky top-0 z-40 w-full bg-surface-container/95 backdrop-blur-xl border-b border-surface-container-highest shadow-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
              title="Return to Home"
            >
              <Stethoscope className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline font-bold text-base text-on-surface leading-tight">
                  ProRoute Theme Visual Inspector
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-mono font-bold">
                  LIVE TOKENS
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Inspecting active CSS variables from <code className="text-secondary font-mono">index.css</code>
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-surface-container-high p-1 rounded-xl border border-surface-container-highest text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setMode('side-by-side')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'side-by-side'
                  ? 'bg-surface-container text-primary shadow-sm font-bold border border-surface-container-highest'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Side-by-Side</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('light')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'light'
                  ? 'bg-surface-container text-amber-600 dark:text-amber-400 shadow-sm font-bold border border-surface-container-highest'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Only</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('dark')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'dark'
                  ? 'bg-surface-container text-sky-500 shadow-sm font-bold border border-surface-container-highest'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {mode === 'side-by-side' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* LEFT: Light Theme Container */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h2 className="font-headline font-bold text-base text-on-surface">
                    Light Theme <span className="text-xs text-outline font-normal">(Scope: :root / .light)</span>
                  </h2>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  bg-background: #f8fafc
                </Badge>
              </div>

              <div className="light bg-background text-on-surface border border-surface-container-highest rounded-3xl p-6 shadow-2xl overflow-hidden transition-colors">
                <ThemeShowcaseContent
                  themeLabel="Light Theme"
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  selectedRadio={selectedRadio}
                  setSelectedRadio={setSelectedRadio}
                  checkboxState={checkboxState}
                  setCheckboxState={setCheckboxState}
                />
              </div>
            </div>

            {/* RIGHT: Dark Theme Container */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <h2 className="font-headline font-bold text-base text-on-surface">
                    Dark Theme <span className="text-xs text-outline font-normal">(Scope: .dark)</span>
                  </h2>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  bg-background: #0c1421
                </Badge>
              </div>

              <div className="dark bg-background text-on-surface border border-surface-container-highest rounded-3xl p-6 shadow-2xl overflow-hidden transition-colors">
                <ThemeShowcaseContent
                  themeLabel="Dark Theme"
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  selectedRadio={selectedRadio}
                  setSelectedRadio={setSelectedRadio}
                  checkboxState={checkboxState}
                  setCheckboxState={setCheckboxState}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single Theme View (Full Width) */
          <div className="w-full max-w-6xl mx-auto">
            <div className={`${mode} bg-background text-on-surface border border-surface-container-highest rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden transition-colors`}>
              <ThemeShowcaseContent
                themeLabel={mode === 'light' ? 'Light Theme (Full View)' : 'Dark Theme (Full View)'}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                selectedRadio={selectedRadio}
                setSelectedRadio={setSelectedRadio}
                checkboxState={checkboxState}
                setCheckboxState={setCheckboxState}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ThemeShowcaseContentProps {
  themeLabel: string;
  activeStep: number;
  setActiveStep: (step: number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedRadio: string;
  setSelectedRadio: (val: string) => void;
  checkboxState: { pmdc: boolean; hipaa: boolean };
  setCheckboxState: React.Dispatch<React.SetStateAction<{ pmdc: boolean; hipaa: boolean }>>;
}

const ThemeShowcaseContent: React.FC<ThemeShowcaseContentProps> = ({
  themeLabel,
  activeStep,
  setActiveStep,
  isModalOpen,
  setIsModalOpen,
  selectedRadio,
  setSelectedRadio,
  checkboxState,
  setCheckboxState,
}) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container-highest">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Active Palette Inspector
          </span>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface mt-0.5">
            {themeLabel}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
            Rendering all production design tokens across real healthcare workflows and clinical UI components.
          </p>
        </div>

        {/* Quick Swatch Bar */}
        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-surface-container-high border border-surface-container-highest">
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-primary border border-surface-container-highest shadow-xs" title="Primary" />
            <span className="text-[9px] font-mono text-outline">Pri</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-secondary border border-surface-container-highest shadow-xs" title="Secondary" />
            <span className="text-[9px] font-mono text-outline">Sec</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-surface border border-surface-container-highest shadow-xs" title="Surface" />
            <span className="text-[9px] font-mono text-outline">Srf</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-surface-container border border-surface-container-highest shadow-xs" title="Container" />
            <span className="text-[9px] font-mono text-outline">Cnt</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-error border border-surface-container-highest shadow-xs" title="Error" />
            <span className="text-[9px] font-mono text-outline">Err</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: HEALTHCARE DASHBOARD                                           */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            A
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Healthcare Dashboard</h3>
            <p className="text-xs text-on-surface-variant">Sidebar, navigation, KPIs, operational stats, and queue table.</p>
          </div>
        </div>

        {/* Mock Full Dashboard Frame */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container-lowest overflow-hidden shadow-lg flex flex-col md:flex-row min-h-[520px]">
          {/* Mini Sidebar */}
          <div className="w-full md:w-56 bg-surface-container-low border-r border-surface-container-highest p-4 flex flex-col justify-between shrink-0 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="font-headline font-bold text-sm text-on-surface">ProRoute</span>
                <span className="text-[9px] font-mono px-1 rounded bg-primary/15 text-primary font-bold">DOC</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-outline px-2 font-semibold">Clinical Hub</span>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container-high text-primary font-semibold text-xs border border-surface-container-highest">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span>Dashboard</span>
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 text-xs">
                  <CalendarClock className="w-4 h-4" />
                  <span>Schedule</span>
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Consultations</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-secondary/15 text-secondary font-bold">4</span>
                </button>
                <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Medical Files</span>
                </button>
              </div>
            </div>

            {/* Doctor Profile Footer in Sidebar */}
            <div className="pt-3 border-t border-surface-container-highest flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-surface-container-highest flex items-center justify-center font-bold text-xs text-primary">
                SJ
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface truncate">Dr. Sarah Jenkins</span>
                <span className="text-[10px] text-outline truncate">Cardiology</span>
              </div>
            </div>
          </div>

          {/* Mini Dashboard Main Content */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col gap-6 bg-surface-container-lowest overflow-x-auto">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-highest/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-primary">Doctor Workspace</span>
                  <Badge variant="doctor" className="text-[9px]">Verified Physician</Badge>
                </div>
                <h4 className="text-xl font-headline font-bold text-on-surface mt-0.5">Welcome back, Dr. Jenkins</h4>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="bg-surface-container-low text-xs rounded-lg pl-8 pr-3 py-1.5 border border-surface-container-highest text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                  />
                </div>
                <Button size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Set Hours</span>
                </Button>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-outline uppercase font-semibold">Total Consults</span>
                  <p className="text-2xl font-headline font-bold text-on-surface mt-0.5">128</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+14% this month</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-outline uppercase font-semibold">Weekly Revenue</span>
                  <p className="text-2xl font-headline font-bold text-on-surface mt-0.5">$5,760</p>
                  <span className="text-[10px] text-secondary font-medium">85% Payout rate</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-outline uppercase font-semibold">Rating</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-2xl font-headline font-bold text-on-surface">4.9</p>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <span className="text-[10px] text-outline">98 verified reviews</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-outline uppercase font-semibold">Slot Capacity</span>
                  <p className="text-2xl font-headline font-bold text-primary mt-0.5">84%</p>
                  <span className="text-[10px] text-outline">16 open slots</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Mock Chart & Appointment Volume */}
            <div className="p-4 rounded-xl bg-surface-container border border-surface-container-highest flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-headline font-bold text-xs text-on-surface">Weekly Consultation Volume</h5>
                  <p className="text-[11px] text-on-surface-variant">Completed vs Scheduled Appointments (Mon – Sun)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Completed
                  </span>
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="w-2.5 h-2.5 rounded-sm bg-secondary" /> Scheduled
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-28 w-full flex items-end justify-between gap-3 pt-4 px-2 border-b border-surface-container-highest">
                {[
                  { day: 'Mon', h1: '65%', h2: '85%' },
                  { day: 'Tue', h1: '75%', h2: '90%' },
                  { day: 'Wed', h1: '90%', h2: '95%' },
                  { day: 'Thu', h1: '50%', h2: '70%' },
                  { day: 'Fri', h1: '80%', h2: '100%' },
                  { day: 'Sat', h1: '40%', h2: '60%' },
                  { day: 'Sun', h1: '20%', h2: '30%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: item.h1 }}
                        className="w-3 rounded-t-sm bg-primary/80 group-hover:bg-primary transition-all"
                        title={`Completed: ${item.h1}`}
                      />
                      <div
                        style={{ height: item.h2 }}
                        className="w-3 rounded-t-sm bg-secondary/70 group-hover:bg-secondary transition-all"
                        title={`Scheduled: ${item.h2}`}
                      />
                    </div>
                    <span className="text-[10px] text-outline font-mono mt-1">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Appointments Table */}
            <div className="rounded-xl border border-surface-container-highest overflow-hidden">
              <div className="p-3 bg-surface-container-high/60 border-b border-surface-container-highest flex items-center justify-between">
                <span className="text-xs font-headline font-bold text-on-surface">Upcoming Consultations Today</span>
                <span className="text-[11px] text-outline font-medium">4 patients queued</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-highest text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Patient</th>
                    <th className="py-2.5 px-3.5">Time</th>
                    <th className="py-2.5 px-3.5">Type</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/60 bg-surface-container">
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-on-surface">Ahmed Raza</td>
                    <td className="py-2.5 px-3.5 text-on-surface-variant">10:00 AM</td>
                    <td className="py-2.5 px-3.5">Cardiology Followup</td>
                    <td className="py-2.5 px-3.5">
                      <Badge variant="success" className="text-[9px]">Confirmed</Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-secondary">$65.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-on-surface">Fatima Noor</td>
                    <td className="py-2.5 px-3.5 text-on-surface-variant">10:30 AM</td>
                    <td className="py-2.5 px-3.5">ECG Review</td>
                    <td className="py-2.5 px-3.5">
                      <Badge variant="warning" className="text-[9px]">Awaiting Join</Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-secondary">$50.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-on-surface">Kamran Shah</td>
                    <td className="py-2.5 px-3.5 text-on-surface-variant">11:15 AM</td>
                    <td className="py-2.5 px-3.5">Hypertension Consultation</td>
                    <td className="py-2.5 px-3.5">
                      <Badge variant="secondary" className="text-[9px]">Rescheduled</Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-secondary">$65.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: DOCTOR ONBOARDING WIZARD                                       */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs">
            B
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Doctor Onboarding Wizard</h3>
            <p className="text-xs text-on-surface-variant">Multi-step stepper, registration inputs, document uploads, and actions.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
          {/* Multi-step progress stepper */}
          <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
            {[
              { step: 1, label: 'Basic Profile' },
              { step: 2, label: 'PMDC Licensure' },
              { step: 3, label: 'Hours & Fee' },
              { step: 4, label: 'Review & Verify' },
            ].map((s, idx) => {
              const isPast = activeStep > s.step;
              const isCurrent = activeStep === s.step;

              return (
                <React.Fragment key={s.step}>
                  <div
                    onClick={() => setActiveStep(s.step)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isPast
                          ? 'bg-primary text-on-primary shadow-sm'
                          : isCurrent
                          ? 'bg-primary-container text-on-primary-container border-2 border-primary shadow-md scale-105'
                          : 'bg-surface-container-high text-outline border border-surface-container-highest'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4" /> : s.step}
                    </div>
                    <span className={`text-[11px] font-medium ${isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all ${isPast ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="h-px w-full bg-surface-container-highest" />

          {/* Form Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto w-full">
            {/* Field 1: Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                Full Practitioner Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                defaultValue="Dr. Sarah Jenkins"
                className="w-full bg-surface-container-low text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-surface-container-highest focus:outline-none focus:border-primary shadow-sm"
              />
              <span className="text-[10px] text-outline">Name as registered with the official medical board.</span>
            </div>

            {/* Field 2: PMDC License */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                <span>PMDC Registration # <span className="text-error">*</span></span>
                <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Registry Validated
                </span>
              </label>
              <input
                type="text"
                defaultValue="PMDC-84920-K"
                className="w-full bg-surface-container-low text-on-surface font-mono uppercase text-xs rounded-xl px-3.5 py-2.5 border border-primary/40 focus:outline-none focus:border-primary shadow-sm"
              />
              <span className="text-[10px] text-outline">Verified against Pakistan Medical & Dental Council.</span>
            </div>

            {/* Field 3: Specialty Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Primary Medical Specialty</label>
              <select className="w-full bg-surface-container-low text-on-surface text-xs rounded-xl px-3 py-2.5 border border-surface-container-highest focus:outline-none focus:border-primary shadow-sm">
                <option value="cardiology">Cardiology & Cardiovascular Disease</option>
                <option value="neurology">Neurology & Neurophysiology</option>
                <option value="dermatology">Dermatology & Aesthetic Medicine</option>
                <option value="pediatrics">Pediatrics & Neonatal Care</option>
              </select>
            </div>

            {/* Field 4: Consultation Fee */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Consultation Fee (USD)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-secondary font-bold text-xs">$</span>
                <input
                  type="number"
                  defaultValue={65}
                  className="w-full bg-surface-container-low text-on-surface font-mono text-xs rounded-xl pl-7 pr-3.5 py-2.5 border border-surface-container-highest focus:outline-none focus:border-primary shadow-sm"
                />
              </div>
              <span className="text-[10px] text-outline">Fixed standard consultation charge per session.</span>
            </div>

            {/* Field 5: Medical Document Upload Component (Full Width) */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface">Medical Degree & PMDC Licensure Certificate</label>
              <div className="border-2 border-dashed border-surface-container-highest rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-surface-container-low/60 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-on-surface">Click to upload or drag & drop</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">PMDC License PDF, PMDC Registration Scan (Max 15MB)</p>
              </div>

              {/* Uploaded File Chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-surface-container-highest text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-on-surface truncate">PMDC_License_Certificate_2026.pdf</span>
                    <span className="text-[10px] text-outline">2.4 MB • Upload Complete</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest">
            <Button
              variant="outline"
              size="sm"
              disabled={activeStep === 1}
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
              className="gap-1.5 text-xs font-semibold"
            >
              <span>Save & Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION C: UI COMPONENTS & FORM CONTROLS                                  */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
            C
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">UI Components & Controls</h3>
            <p className="text-xs text-on-surface-variant">Buttons, inputs, selects, radios, checkboxes, alerts, modal dialog.</p>
          </div>
        </div>

        {/* 1. Buttons Matrix */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-5 flex flex-col gap-4 shadow-sm">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Button Hierarchy</span>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Action</Button>
            <Button variant="clinical">Clinical Gradient</Button>
            <Button variant="destructive">Destructive / Cancel</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button disabled>Disabled State</Button>
          </div>
        </div>

        {/* 2. Form Inputs, Radios & Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-5 flex flex-col gap-4 shadow-sm">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Form Field States</span>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-on-surface">Standard Input</label>
                <input
                  type="text"
                  placeholder="Placeholder text..."
                  className="w-full bg-surface-container-low text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-surface-container-highest focus:outline-none focus:border-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-error flex items-center justify-between">
                  <span>Input With Validation Error</span>
                  <span className="text-[10px]">Required</span>
                </label>
                <input
                  type="text"
                  defaultValue="invalid-email-format"
                  className="w-full bg-surface-container-low text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-error focus:outline-none mt-1"
                />
                <span className="text-[10px] text-error mt-0.5 block">Please provide a valid medical center email address.</span>
              </div>
            </div>
          </div>

          {/* Radios & Checkboxes */}
          <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-5 flex flex-col justify-between gap-4 shadow-sm">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Toggles & Selection</span>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-on-surface">Consultation Method (Radio)</span>
              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setSelectedRadio('video')}
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    selectedRadio === 'video'
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-surface-container-low border-surface-container-highest text-on-surface'
                  }`}
                >
                  <input type="radio" checked={selectedRadio === 'video'} readOnly className="accent-primary" />
                  <span className="text-xs">Live Telehealth</span>
                </label>
                <label
                  onClick={() => setSelectedRadio('in-person')}
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    selectedRadio === 'in-person'
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-surface-container-low border-surface-container-highest text-on-surface'
                  }`}
                >
                  <input type="radio" checked={selectedRadio === 'in-person'} readOnly className="accent-primary" />
                  <span className="text-xs">Clinic Visit</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-highest">
              <span className="text-[11px] font-semibold text-on-surface">Compliance Agreements (Checkboxes)</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                <input
                  type="checkbox"
                  checked={checkboxState.pmdc}
                  onChange={(e) => setCheckboxState((prev) => ({ ...prev, pmdc: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span>I confirm active PMDC clinical licensing without disciplinary sanctions.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                <input
                  type="checkbox"
                  checked={checkboxState.hipaa}
                  onChange={(e) => setCheckboxState((prev) => ({ ...prev, hipaa: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span>Agree to Protected Health Information (PHI) confidentiality protocols.</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Alerts */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-5 flex flex-col gap-3 shadow-sm">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Semantic Alerts</span>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
            <div className="flex-1">
              <strong className="font-semibold block">Success Confirmation:</strong>
              <span className="opacity-90">Appointment booked successfully. A calendar invite has been sent to your email.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <strong className="font-semibold block">Action Needed:</strong>
              <span className="opacity-90">Your PMDC license certificate requires renewal in 14 days. Please re-verify.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-error" />
            <div className="flex-1">
              <strong className="font-semibold block">Booking Conflict Detected:</strong>
              <span className="opacity-90">This time slot was claimed during checkout. Please choose an alternate slot.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-secondary" />
            <div className="flex-1">
              <strong className="font-semibold block">Telehealth Preparation:</strong>
              <span className="opacity-90">The consultation room opens 5 minutes before scheduled session time.</span>
            </div>
          </div>
        </div>

        {/* 4. Modal / Dialog Preview Card */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container-lowest p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Modal Dialog Component</span>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(!isModalOpen)} className="h-7 text-[10px]">
              {isModalOpen ? 'Hide Dialog' : 'Show Dialog'}
            </Button>
          </div>

          {isModalOpen && (
            <div className="relative rounded-2xl border border-surface-container-highest bg-surface-container p-6 shadow-2xl max-w-lg mx-auto w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-base text-on-surface">Confirm Consultation</h4>
                    <p className="text-[11px] text-on-surface-variant">Review appointment particulars</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-outline hover:text-on-surface p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-outline">Practitioner:</span>
                  <span className="font-bold text-on-surface">Dr. Sarah Jenkins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Date & Time:</span>
                  <span className="font-bold text-on-surface">Tomorrow at 10:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Specialty:</span>
                  <span className="text-primary font-bold">Cardiology</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-surface-container-highest">
                  <span className="text-outline">Consultation Fee:</span>
                  <span className="font-bold text-secondary text-sm">$65.00</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Dismiss
                </Button>
                <Button size="sm">
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION D: TYPOGRAPHY & SURFACES                                          */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            D
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Typography & Surfaces</h3>
            <p className="text-xs text-on-surface-variant">Headlines, body hierarchy, surface elevation, and depth containers.</p>
          </div>
        </div>

        {/* Typography Showcase */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-6 flex flex-col gap-4 shadow-sm">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Typography Hierarchy</span>

          <div className="flex flex-col gap-2 pb-4 border-b border-surface-container-highest">
            <h1 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface tracking-tight">
              Primary Headline: Precision Care Access
            </h1>
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-on-surface">
              Secondary Section Header: Board-Certified Verification
            </h2>
            <h3 className="text-base sm:text-lg font-headline font-semibold text-on-surface">
              Card Subtitle: Specialty Clinical Consultations
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-on-surface leading-relaxed">
              <strong>Body Text:</strong> ProRoute connects patients with thoroughly verified physicians across recognized medical boards. Instant consultation booking guarantees protected slots with zero double-booking.
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Muted Explanatory Text:</strong> All clinical document uploads are preserved with medical confidentiality protocols. Records are accessible strictly during authorized visit windows.
            </p>
            <p className="text-[11px] font-mono text-outline">
              <strong>Monospace Tag Text:</strong> LIC-PMDC-2026-CARDIO-84920 · STATUS: VERIFIED
            </p>
          </div>
        </div>

        {/* Surfaces Hierarchy */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container-low p-6 flex flex-col gap-4 shadow-sm">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Container Surface Elevation Stack</span>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-center flex flex-col items-center justify-center gap-1 shadow-xs">
              <span className="text-xs font-bold text-on-surface">lowest</span>
              <span className="text-[9px] font-mono text-outline">#surface-lowest</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-highest text-center flex flex-col items-center justify-center gap-1 shadow-xs">
              <span className="text-xs font-bold text-on-surface">low</span>
              <span className="text-[9px] font-mono text-outline">#surface-low</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container border border-surface-container-highest text-center flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-xs font-bold text-on-surface">container</span>
              <span className="text-[9px] font-mono text-outline">#surface-container</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-surface-container-highest text-center flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-xs font-bold text-on-surface">high</span>
              <span className="text-[9px] font-mono text-outline">#surface-high</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-highest border border-outline-variant text-center flex flex-col items-center justify-center gap-1 shadow-lg">
              <span className="text-xs font-bold text-on-surface">highest</span>
              <span className="text-[9px] font-mono text-outline">#surface-highest</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION E: HEALTHCARE-SPECIFIC COMPONENTS                                 */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs">
            E
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Healthcare-Specific Components</h3>
            <p className="text-xs text-on-surface-variant">Licensure badges, Doctor Card, Patient Card, and Confirmed Booking Receipt.</p>
          </div>
        </div>

        {/* 1. Status Badges Row */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container p-5 flex flex-col gap-3 shadow-sm">
          <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider">Clinical Status Indicators</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/25">
              <ShieldCheck className="w-3.5 h-3.5" />
              PMDC Verified Practitioner
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              Pending Admin Review
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 text-error text-xs font-semibold border border-error/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Licensure Rejected
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-semibold border border-secondary/30">
              <Sparkles className="w-3.5 h-3.5" />
              Telehealth Ready
            </span>
          </div>
        </div>

        {/* 2. Doctor Profile Card & Patient Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Doctor Profile Card */}
          <div className="bg-surface-container rounded-2xl border border-surface-container-highest p-5 shadow-lg flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-primary/30 flex items-center justify-center font-bold text-xl text-primary shrink-0 shadow-inner">
                DR
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold">
                    Cardiology
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <h4 className="font-headline font-bold text-base text-on-surface mt-1">Dr. Tariq Mehmood</h4>
                <span className="text-[11px] text-on-surface-variant font-medium">14 years clinical experience • Aga Khan University</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-surface-container-highest/60 leading-relaxed">
              Specializing in non-invasive cardiology, preventive cardiology, hypertension, and advanced heart health monitoring.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest">
              <div>
                <span className="text-[10px] text-outline uppercase font-semibold block">Consultation Fee</span>
                <span className="text-base font-headline font-bold text-secondary">$65.00</span>
              </div>
              <Button size="sm" className="gap-1 text-xs">
                <span>Book Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Patient Profile Card */}
          <div className="bg-surface-container rounded-2xl border border-surface-container-highest p-5 shadow-lg flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center font-bold text-xl text-secondary shrink-0">
                PZ
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                    Patient Profile
                  </span>
                  <span className="text-[10px] text-outline font-mono">MRN-90218</span>
                </div>
                <h4 className="font-headline font-bold text-base text-on-surface mt-1">Parveen Zafar</h4>
                <span className="text-[11px] text-on-surface-variant">Last Visit: 12 Oct 2026 • 3 Prescriptions Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col">
                <span className="text-outline text-[10px]">Blood Group</span>
                <span className="font-bold text-on-surface mt-0.5">B Positive (B+)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col">
                <span className="text-outline text-[10px]">Upcoming Visit</span>
                <span className="font-bold text-primary mt-0.5">Tomorrow, 10 AM</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest">
              <span className="text-xs text-outline flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-secondary" /> Confidential PHI Record
              </span>
              <Button variant="outline" size="sm" className="text-xs h-8">
                View Health Records
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Booking Confirmed Receipt Card */}
        <div className="rounded-2xl border border-surface-container-highest bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">Appointment Confirmed</span>
              <h4 className="font-headline font-bold text-lg text-on-surface">Consultation Receipt #PR-83921</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container border border-surface-container-highest flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-outline">Patient:</span>
              <span className="font-bold text-on-surface">Parveen Zafar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Doctor:</span>
              <span className="font-bold text-on-surface">Dr. Tariq Mehmood (Cardiology)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Scheduled Slot:</span>
              <span className="font-bold text-on-surface">Monday, 04 Nov 2026 · 10:00 AM PKT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Platform Concurrency Lock:</span>
              <span className="font-mono text-primary font-semibold">RESERVED · ZERO DOUBLE BOOKING</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest font-bold text-sm">
              <span className="text-on-surface">Total Amount Paid:</span>
              <span className="text-secondary">$65.00</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
              Download PDF Invoice
            </Button>
            <Button size="sm" className="w-full sm:w-auto text-xs font-semibold">
              Add to Google Calendar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemePreviewPage;
