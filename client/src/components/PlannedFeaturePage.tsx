import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from './ui';

interface PlannedFeaturePageProps {
  title: string;
  category: string;
  description: string;
  plannedFeatures: string[];
  backPath: string;
  backLabel: string;
  icon: LucideIcon;
  badgeVariant?: 'default' | 'secondary' | 'admin' | 'doctor' | 'patient';
}

export const PlannedFeaturePage: React.FC<PlannedFeaturePageProps> = ({
  title,
  category,
  description,
  plannedFeatures,
  backPath,
  backLabel,
  icon: Icon,
  badgeVariant = 'secondary',
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to={backPath}>
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-mono text-outline hover:text-on-surface">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {backLabel}
          </Button>
        </Link>

        <Badge variant={badgeVariant} className="font-mono text-xs px-2.5 py-1">
          <Clock className="w-3 h-3 mr-1" />
          Upcoming Feature · In Active Development
        </Badge>
      </div>

      {/* Main Banner Hero */}
      <Card className="border-surface-container-highest/60 bg-surface-container/60 backdrop-blur-xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <CardHeader className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-md">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-widest text-outline font-semibold">
                {category}
              </span>
              <CardTitle className="text-xl sm:text-2xl font-headline font-bold text-on-surface">
                {title}
              </CardTitle>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
            {description}
          </p>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0 flex flex-col gap-6">
          {/* Planned Capabilities Section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Upcoming Capabilities:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plannedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-container-high/60 border border-surface-container-highest flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-on-surface font-medium leading-snug">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & System Architecture Guarantee */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Healthcare Security Standard</span>
                <span className="text-[11px] text-on-surface-variant">
                  Enterprise Healthcare Security & HIPAA/PMDC Data Privacy Enforced.
                </span>
              </div>
            </div>

            <Link to={backPath}>
              <Button size="sm" className="text-xs font-semibold">
                Return to Active Workspace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

