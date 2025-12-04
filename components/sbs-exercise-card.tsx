'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExerciseLog, AlternativeExercise } from '@/lib/types';
import type { SBSPrescription } from '@/lib/sbs-calculations';
import { getSetsPerWeekLogic } from '@/lib/sbs-calculations';

interface SBSExerciseCardProps {
  exerciseName: string;
  prescription: SBSPrescription;
  exerciseLog: ExerciseLog;
  lastSetIntensity?: string;
  description?: string;
  link?: string;
  alternatives?: AlternativeExercise[];
  onUpdateLog: (log: ExerciseLog) => void;
}

export function SBSExerciseCard({
  exerciseName,
  prescription,
  exerciseLog,
  lastSetIntensity,
  description,
  link,
  alternatives,
  onUpdateLog,
}: SBSExerciseCardProps) {
  const [setsCompleted, setSetsCompleted] = useState<number>(
    exerciseLog.setsCompleted ?? 0
  );
  const [exerciseNotes, setExerciseNotes] = useState(exerciseLog.notes || '');
  const [showAlternatives, setShowAlternatives] = useState(false);

  const setGoalLogic = getSetsPerWeekLogic(prescription.liftKey);
  const setGoalMin = setGoalLogic.default_range.min;
  const setGoalMax = setGoalLogic.default_range.max;

  const updateSetsCompleted = (value: number) => {
    const newValue = Math.max(0, value);
    setSetsCompleted(newValue);
    onUpdateLog({
      ...exerciseLog,
      setsCompleted: newValue,
    });
  };

  const updateNotes = (value: string) => {
    setExerciseNotes(value);
    onUpdateLog({
      ...exerciseLog,
      notes: value,
    });
  };

  // Determine status based on sets completed vs goal
  const getSetStatus = () => {
    if (setsCompleted === 0) return 'pending';
    if (setsCompleted >= setGoalMin && setsCompleted <= setGoalMax) return 'on-target';
    if (setsCompleted > setGoalMax) return 'above'; // TM increase
    return 'below'; // TM decrease
  };

  const status = getSetStatus();
  const statusColors = {
    pending: 'bg-muted text-muted-foreground',
    'on-target': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    above: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    below: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {exerciseName}
              <Badge variant="secondary">SBS</Badge>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </CardTitle>
            {lastSetIntensity && (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Last set: {lastSetIntensity}
              </p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Alternatives Section */}
        {alternatives && alternatives.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {showAlternatives ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}
            </button>
            {showAlternatives && (
              <div className="mt-2 pl-4 border-l-2 border-muted space-y-1">
                {alternatives.map((alt, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
                    <span>{alt.name}</span>
                    {alt.link && (
                      <a
                        href={alt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prescription Display */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{prescription.weight}</div>
            <div className="text-xs text-muted-foreground">Weight (kg)</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{prescription.targetReps}</div>
            <div className="text-xs text-muted-foreground">Reps</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{prescription.targetRIR}</div>
            <div className="text-xs text-muted-foreground">RIR cutoff</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{setGoalMin}-{setGoalMax}</div>
            <div className="text-xs text-muted-foreground">Set goal</div>
          </div>
        </div>

        {/* Sets Completed Input */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Sets Completed</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => updateSetsCompleted(setsCompleted - 1)}
                disabled={setsCompleted <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className={`px-4 py-2 rounded-md min-w-[60px] text-center font-bold ${statusColors[status]}`}>
                {setsCompleted}
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => updateSetsCompleted(setsCompleted + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          {setsCompleted > 0 && (
            <div className="mt-2 text-sm text-right">
              {status === 'on-target' && (
                <span className="text-green-600 dark:text-green-400">On target - maintain TM</span>
              )}
              {status === 'above' && (
                <span className="text-blue-600 dark:text-blue-400">Above range - increase TM</span>
              )}
              {status === 'below' && (
                <span className="text-orange-600 dark:text-orange-400">Below range - decrease TM</span>
              )}
            </div>
          )}
        </div>

        {/* Notes Input */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Notes (optional)</label>
          <Input
            value={exerciseNotes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="How did it feel? Any observations..."
            className="h-9"
          />
        </div>
      </CardContent>
    </Card>
  );
}
