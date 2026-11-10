import React from 'react';
import { Calendar, Trash2, Plus, Ban, Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { ScheduleOverride } from '../../../../services/availability.service';

interface DateOverrideListProps {
  overrides: ScheduleOverride[];
  onDelete: (id: string) => Promise<void>;
  onAddClick: () => void;
}

export const DateOverrideList: React.FC<DateOverrideListProps> = ({
  overrides,
  onDelete,
  onAddClick,
}) => {
  return (
    <Card className="border-surface-container-highest bg-surface-container shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold text-on-surface">Date-Specific Overrides</CardTitle>
          </div>
          <CardDescription className="text-xs text-on-surface-variant mt-1">
            Blackout dates for holidays or configure custom hours.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="text-primary hover:bg-primary/10 border-primary/30 h-8 gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Override
        </Button>
      </CardHeader>

      <CardContent className="pt-1">
        {overrides.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-surface-container-highest text-on-surface-variant">
            <p className="text-xs">No upcoming date overrides or holiday blocks configured.</p>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Your standard weekly recurring schedule applies to all upcoming calendar dates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-highest/60 border border-surface-container-highest rounded-xl overflow-hidden">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="p-3 flex items-center justify-between gap-3 bg-surface-container-high/20 hover:bg-surface-container-high/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[60px] p-1.5 rounded-lg bg-surface-container border border-surface-container-highest">
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase">
                      {new Date(override.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                    </span>
                    <span className="text-sm font-extrabold text-on-surface block">
                      {new Date(override.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      {override.isBlocked ? (
                        <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0.5">
                          <Ban className="w-2.5 h-2.5" /> BLOCKED
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                          <Clock className="w-2.5 h-2.5" /> {override.customStartTime} - {override.customEndTime}
                        </Badge>
                      )}
                      <span className="text-xs font-semibold text-on-surface">
                        {override.date}
                      </span>
                    </div>
                    {override.reason && (
                      <p className="text-[11px] text-on-surface-variant mt-0.5 italic">
                        "{override.reason}"
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(override.id)}
                  title="Remove override"
                  className="text-on-surface-variant hover:text-error hover:bg-error/10 h-8 w-8 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

