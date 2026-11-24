import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicDoctor } from '../../../services/doctor.service';
import { useCurrency } from '../../../context/CurrencyContext';
import {
  Stethoscope,
  HeartPulse,
  Brain,
  Bone,
  Ear,
  Baby,
  Sparkles,
  BadgeCheck,
  Calendar,
  Clock,
  Building2,
  ChevronRight,
} from 'lucide-react';

export const getSpecialtyLucideIcon = (slug?: string) => {
  switch (slug) {
    case 'cardiology':
      return HeartPulse;
    case 'dermatology':
      return Sparkles;
    case 'neurology':
      return Brain;
    case 'orthopedics':
      return Bone;
    case 'ent':
      return Ear;
    case 'pediatrics':
      return Baby;
    case 'general-medicine':
    default:
      return Stethoscope;
  }
};

interface DoctorCardProps {
  doc: PublicDoctor;
  onBookSlot?: (doc: PublicDoctor) => void;
  viewMode?: 'grid' | 'list';
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doc,
  onBookSlot,
  viewMode = 'grid',
}) => {
  const navigate = useNavigate();
  const { currency, formatFee, rate } = useCurrency();
  const SpecialtyIcon = getSpecialtyLucideIcon(doc.specialty?.slug);

  const handleBook = () => {
    if (onBookSlot) {
      onBookSlot(doc);
    } else {
      navigate(`/doctors/${doc.id}`);
    }
  };

  const feeValue = doc.consultationFee ? Number(doc.consultationFee) : 35;
  const primaryFee = formatFee(feeValue);
  const secondaryFee =
    currency === 'PKR'
      ? `$${feeValue.toFixed(0)}`
      : `~Rs. ${Math.round(feeValue * rate).toLocaleString('en-PK')}`;

  // ===================== LIST VIEW SHAPE =====================
  if (viewMode === 'list') {
    return (
      <div className="bg-surface rounded-2xl border border-surface-container-highest/80 p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 ease-out flex flex-col md:flex-row md:items-center justify-between gap-5 group">
        {/* Left: Practitioner Identity */}
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-xl border border-primary/20 shadow-xs transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transform-none">
              {doc.name.charAt(0)}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center"
              title="Verified & Active Practitioner"
            >
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-surface" />
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {doc.specialty && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold border border-secondary/20">
                  <SpecialtyIcon className="w-3 h-3" />
                  {doc.specialty.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-outline" />
                30m Video
              </span>
            </div>

            <h3
              onClick={handleBook}
              className="font-headline font-bold text-base sm:text-lg text-on-surface truncate group-hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              {doc.name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5 flex-wrap">
              {doc.yearsOfExperience !== null && (
                <span className="font-mono text-outline">
                  {doc.yearsOfExperience} yrs clinical experience
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                <Building2 className="w-3 h-3" />
                Licensed Healthcare Practitioner
              </span>
            </div>

            <p className="text-xs text-on-surface-variant line-clamp-1 mt-1.5 leading-relaxed hidden sm:block">
              {doc.bio || 'Board-certified medical practitioner available for remote telehealth consultations.'}
            </p>
          </div>
        </div>

        {/* Right: Pricing & Action Button */}
        <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-surface-container-highest/60">
          <div className="flex flex-col md:text-right">
            <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Consultation Fee
            </span>
            <div className="flex items-baseline gap-1.5 md:justify-end">
              <span className="font-headline font-extrabold text-xl text-primary">
                {primaryFee}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant/75">
                ({secondaryFee})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBook}
            className="group/btn px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 flex items-center gap-1.5 active:scale-95 motion-reduce:transform-none cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110 motion-reduce:transform-none" />
            <span>Book Slot</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70 transition-transform duration-200 group-hover/btn:translate-x-0.5 motion-reduce:transform-none" />
          </button>
        </div>
      </div>
    );
  }

  // ===================== GRID VIEW SHAPE =====================
  return (
    <div className="bg-surface rounded-2xl border border-surface-container-highest/80 p-5 sm:p-6 shadow-xs hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 ease-out flex flex-col justify-between gap-4 group">
      {/* Doctor Info Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-xl border border-primary/20 shadow-xs transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none">
            {doc.name.charAt(0)}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center"
            title="Online & Available"
          >
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-surface" />
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {doc.specialty && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold border border-secondary/20">
                <SpecialtyIcon className="w-3 h-3" />
                {doc.specialty.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </span>
          </div>

          <h3
            onClick={handleBook}
            className="font-headline font-bold text-base text-on-surface truncate mt-1.5 group-hover:text-primary transition-colors duration-150 cursor-pointer"
          >
            {doc.name}
          </h3>

          <div className="flex items-center gap-2 mt-0.5">
            {doc.yearsOfExperience !== null ? (
              <span className="text-[11px] text-on-surface-variant font-mono">
                {doc.yearsOfExperience} years clinical exp.
              </span>
            ) : (
              <span className="text-[11px] text-primary font-mono font-medium">
                Verified Specialist
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio Preview */}
      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed bg-surface-container-low/70 p-3.5 rounded-xl border border-surface-container-highest/60 transition-colors group-hover:border-primary/20">
        {doc.bio || 'Board-certified medical practitioner available for remote telehealth consultations and clinical reviews.'}
      </p>

      {/* Pricing & CTA Button */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest/60">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-outline uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> 30m Session
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline font-extrabold text-lg text-primary">
              {primaryFee}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant/75">
              ({secondaryFee})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBook}
          className="group/btn px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 flex items-center gap-1.5 active:scale-95 motion-reduce:transform-none cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110 motion-reduce:transform-none" />
          <span>Book Slot</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-70 transition-transform duration-200 group-hover/btn:translate-x-0.5 motion-reduce:transform-none" />
        </button>
      </div>
    </div>
  );
};

