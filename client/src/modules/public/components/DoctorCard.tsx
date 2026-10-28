import React from 'react';
import { PublicDoctor } from '../../../services/doctor.service';

export const getSpecialtyIcon = (slug?: string) => {
  switch (slug) {
    case 'cardiology':
      return 'cardiology';
    case 'dermatology':
      return 'dermatology';
    case 'neurology':
      return 'neurology';
    case 'orthopedics':
      return 'orthopedics';
    case 'ent':
      return 'hearing';
    case 'pediatrics':
      return 'child_care';
    case 'general-medicine':
    default:
      return 'stethoscope';
  }
};

interface DoctorCardProps {
  doc: PublicDoctor;
  onBookSlot?: (doc: PublicDoctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doc, onBookSlot }) => {
  return (
    <div className="bg-surface-container/85 backdrop-blur-xl rounded-2xl border border-surface-container-highest/70 p-5 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group">
      {/* Doctor Info Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary font-bold text-xl border border-primary/20 shadow-inner">
            {doc.name.charAt(0)}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-container border-2 border-surface-container"></span>
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {doc.specialty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-medium">
                <span className="material-symbols-outlined text-[13px]">
                  {getSpecialtyIcon(doc.specialty.slug)}
                </span>
                {doc.specialty.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              Verified
            </span>
          </div>
          <h3 className="font-headline font-bold text-base text-on-surface truncate mt-1 group-hover:text-primary transition-colors">
            {doc.name}
          </h3>
          {doc.yearsOfExperience !== null && (
            <span className="text-xs text-on-surface-variant font-mono">
              {doc.yearsOfExperience} years clinical exp.
            </span>
          )}
        </div>
      </div>

      {/* Bio Preview */}
      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed bg-surface-container-lowest/60 p-3 rounded-xl border border-surface-container-highest/40">
        {doc.bio || 'Board-certified medical practitioner available for remote telehealth consultations and clinical reviews.'}
      </p>

      {/* Pricing & CTA Button */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-container-highest/60">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-outline uppercase">
            Consultation
          </span>
          <span className="font-headline font-bold text-base text-secondary">
            ${doc.consultationFee ? Number(doc.consultationFee).toFixed(2) : '35.00'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBookSlot?.(doc)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-fixed shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          Book Slot
        </button>
      </div>
    </div>
  );
};
