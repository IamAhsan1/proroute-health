import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Pill, FileText, Bot } from 'lucide-react';

interface PatientMetricCardsProps {
  scheduledConsultsCount?: number;
  activeRegimensCount?: number;
  medicalRecordsCount?: number;
}

export const PatientMetricCards: React.FC<PatientMetricCardsProps> = ({
  scheduledConsultsCount = 0,
  activeRegimensCount = 0,
  medicalRecordsCount = 0,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Consultations */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold">Scheduled Visits</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {scheduledConsultsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 flex items-center justify-between text-xs">
          <Link to="/doctors" className="text-primary hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded">
            Book Specialist
          </Link>
        </div>
      </div>

      {/* Stat 2: Active Prescriptions */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-secondary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold">Prescriptions</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {activeRegimensCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 text-xs text-outline">
          No active prescriptions
        </div>
      </div>

      {/* Stat 3: Vault Records */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold">Medical Records</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {medicalRecordsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 flex items-center justify-between text-xs">
          <Link to="/portal/records" className="text-primary hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded">
            View Documents
          </Link>
        </div>
      </div>

      {/* Stat 4: AI Triage Routing */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-secondary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold">AI Symptom Assistant</span>
            <span className="text-xs font-semibold text-primary mt-1">
              Smart Guidance
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 flex items-center justify-between text-xs">
          <span className="text-outline">Available Soon</span>
        </div>
      </div>
    </section>
  );
};
