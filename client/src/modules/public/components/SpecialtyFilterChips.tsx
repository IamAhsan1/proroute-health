import React from 'react';
import { Specialty } from '../../../services/specialty.service';
import { getSpecialtyIcon } from './DoctorCard';

interface SpecialtyFilterChipsProps {
  specialties: Specialty[];
  selectedSpecialtyId: string;
  onSelectSpecialty: (id: string) => void;
  isLoading: boolean;
}

export const SpecialtyFilterChips: React.FC<SpecialtyFilterChipsProps> = ({
  specialties,
  selectedSpecialtyId,
  onSelectSpecialty,
  isLoading,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-mono uppercase tracking-wider text-outline">
        Filter by Clinical Specialty
      </span>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectSpecialty('')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedSpecialtyId === ''
              ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
              : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain</span>
          All Specialties
        </button>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-outline animate-pulse">
            Loading specialties...
          </div>
        ) : (
          specialties.map((spec) => {
            const active = selectedSpecialtyId === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => onSelectSpecialty(active ? '' : spec.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-secondary text-on-secondary shadow-md shadow-secondary/20 font-semibold'
                    : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {getSpecialtyIcon(spec.slug)}
                </span>
                {spec.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
