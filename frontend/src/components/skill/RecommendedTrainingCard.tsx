import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Compass, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LearningRecommendation } from '@/types/skill';
import api from '@/services/api';

export interface RecommendedTrainingCardProps {
  className?: string;
}

export const RecommendedTrainingCard: React.FC<RecommendedTrainingCardProps> = ({
  className
}) => {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/workers/learning-recommendations/')
      .then((res) => {
        if (res.data?.recommendations) {
          setRecommendations(res.data.recommendations);
        }
      })
      .catch((err) => {
        console.warn('Learning recommendations error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Advisory Learning Pathways (प्रशिक्षण सुझाव)
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            Trade Micro-Credentials & Upskilling
          </h3>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          AI recommendations are purely advisory suggestions based on local customer demand and trade skill gaps. UNNATI never makes false enrollment claims.
        </span>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Analyzing trade opportunities and skill demands...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No training suggestions currently available for your trade.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {rec.demand_trend}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {rec.certification_level}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {rec.course_title}
                </h4>

                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  Provider: {rec.provider}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {rec.estimated_duration}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {rec.mode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
