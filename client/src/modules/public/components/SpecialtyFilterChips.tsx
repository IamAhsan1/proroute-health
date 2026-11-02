import React from 'react';
import { Specialty } from '../../../services/specialty.service';
import { getSpecialtyLucideIcon } from './DoctorCard';
import { Layers } from 'lucide-react';

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
      <span className="text-xs font-semibold text-on-surface-variant">
        Filter by Clinical Specialty
      </span>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => onSelectSpecialty('')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            selectedSpecialtyId === ''
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          All Specialties
        </button>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-outline">
            Loading specialties...
          </div>
        ) : (
          specialties.map((spec) => {
            const active = selectedSpecialtyId === spec.id;
            const SpecIcon = getSpecialtyLucideIcon(spec.slug);
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => onSelectSpecialty(active ? '' : spec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <SpecIcon className="w-3.5 h-3.5" />
                {spec.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
