import React from 'react';
import { PublicDoctor } from '../../../services/doctor.service';
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
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doc, onBookSlot }) => {
  const SpecialtyIcon = getSpecialtyLucideIcon(doc.specialty?.slug);

  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-highest p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between gap-4">
      {/* Doctor Info Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
            {doc.name.charAt(0)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-surface-container" title="Online & Available" />
        </div>

        {/* Details */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {doc.specialty && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold">
                <SpecialtyIcon className="w-3.5 h-3.5" />
                {doc.specialty.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>

          <h3 className="font-headline font-bold text-base text-on-surface truncate mt-1.5 group-hover:text-primary transition-colors">
            {doc.name}
          </h3>

          <div className="flex items-center gap-2 mt-0.5">
            {doc.yearsOfExperience !== null ? (
              <span className="text-[11px] text-on-surface-variant font-mono">
                {doc.yearsOfExperience} years clinical exp.
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                Verified Specialist
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio Preview */}
      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed bg-surface-container-low p-3 rounded-xl border border-surface-container-highest/60">
        {doc.bio || 'Board-certified medical practitioner available for remote telehealth consultations and clinical reviews.'}
      </p>

      {/* Pricing & CTA Button */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest/60">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
            Consultation Fee
          </span>
          <span className="font-headline font-extrabold text-base text-on-surface">
            ${doc.consultationFee ? Number(doc.consultationFee).toFixed(2) : '35.00'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBookSlot?.(doc)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          Book Slot
        </button>
      </div>
    </div>
  );
};
