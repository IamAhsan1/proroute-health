import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Stethoscope,
  BadgeCheck,
  Award,
  DollarSign,
  ShieldCheck,
  Building2,
  FileCheck2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { DoctorSlotPicker } from '../components/booking/DoctorSlotPicker';
import { availabilityService } from '../../../services/availability.service';

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: doctor, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-detail', id],
    queryFn: () => (id ? availabilityService.getDoctorById(id) : null),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading doctor profile & availability...</span>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-surface-container border border-surface-container-highest text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-lg font-bold text-on-surface">Doctor Not Available</h2>
        <p className="text-xs text-on-surface-variant">
          This doctor profile is currently unavailable or pending verification.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/doctors">Back to Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Back to Directory Navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-on-surface-variant hover:text-on-surface">
          <Link to="/doctors">
            <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
          </Link>
        </Button>
      </div>

      {/* Main Grid: Left Doctor Info, Right Slot Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-surface-container-highest bg-surface-container shadow-md space-y-5">
            {/* Avatar & Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-bold text-on-surface">{doctor.name}</h1>
                  <span title="PMDC / Board Verified" className="inline-flex">
                    <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                  </span>
                </div>
                {doctor.specialty && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {doctor.specialty.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-container-highest/60">
              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-surface-container-highest">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary" /> Experience
                </span>
                <span className="text-sm font-extrabold text-on-surface mt-1 block">
                  {doctor.yearsOfExperience ? `${doctor.yearsOfExperience} Years` : 'Senior Consultant'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-surface-container-highest">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-primary" /> Consultation Fee
                </span>
                <span className="text-sm font-extrabold text-primary mt-1 block">
                  {doctor.consultationFee ? `$${doctor.consultationFee}` : 'Free Consultation'}
                </span>
              </div>
            </div>

            {/* Bio */}
            {doctor.bio && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">About Doctor</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            {/* Credential Badges */}
            <div className="space-y-2 pt-3 border-t border-surface-container-highest/60 text-xs">
              {doctor.medicalBoard && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Medical Board: <strong className="text-on-surface">{doctor.medicalBoard}</strong>
                  </span>
                </div>
              )}
              {doctor.licenseNumber && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <FileCheck2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Licensure No: <strong className="text-on-surface">{doctor.licenseNumber}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-primary font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Healthcare Practitioner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Slot Picker Widget */}
        <div className="lg:col-span-7">
          <DoctorSlotPicker
            doctorId={doctor.id}
            consultationFee={doctor.consultationFee}
            onBookSlot={(slot) => {
              alert(
                `Selected appointment on ${slot.startUtc} (${slot.localStartTime} - ${slot.localEndTime}). Concurrency-safe booking will be completed in Phase 4!`
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
