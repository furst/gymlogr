'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, History, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getLastExerciseSets } from '@/lib/db';
import type { ExerciseLog, SetLog, AlternativeExercise, RegularExerciseTargets } from '@/lib/types';

interface PreviousSet {
  weight: number;
  reps: number;
  notes?: string;
}

interface RegularExerciseCardProps {
  exerciseName: string;
  exerciseLog: ExerciseLog;
  lastSetIntensity?: string;
  description?: string;
  link?: string;
  alternatives?: AlternativeExercise[];
  targets?: RegularExerciseTargets;
  programId?: string;
  onUpdateLog: (log: ExerciseLog) => void;
}

export function RegularExerciseCard({
  exerciseName,
  exerciseLog,
  lastSetIntensity,
  description,
  link,
  alternatives,
  targets,
  programId,
  onUpdateLog,
}: RegularExerciseCardProps) {
  const [previousSets, setPreviousSets] = useState<PreviousSet[]>([]);
  const [previousNotes, setPreviousNotes] = useState<string | undefined>();
  const [newSetWeight, setNewSetWeight] = useState('');
  const [newSetReps, setNewSetReps] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState(exerciseLog.notes || '');
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    const loadPreviousData = async () => {
      const data = await getLastExerciseSets(exerciseName, programId);
      if (data) {
        setPreviousSets(data.sets);
        setPreviousNotes(data.exerciseNotes);
        // Pre-fill with first set's weight/reps if not already filled
        if (data.sets.length > 0 && !newSetWeight) {
          setNewSetWeight(data.sets[0].weight.toString());
          setNewSetReps(data.sets[0].reps.toString());
        }
      }
    };
    loadPreviousData();
  }, [exerciseName, programId]);

  const completedSets = exerciseLog.sets.filter(s => s.completed).length;

  const addSet = () => {
    const setNumber = exerciseLog.sets.length + 1;
    const newSet: SetLog = {
      setNumber,
      weight: parseFloat(newSetWeight) || 0,
      reps: parseInt(newSetReps) || 0,
      completed: true,
    };

    onUpdateLog({
      ...exerciseLog,
      sets: [...exerciseLog.sets, newSet],
    });

    // Pre-fill next set based on previous workout if available
    const nextPrevSet = previousSets[exerciseLog.sets.length + 1];
    if (nextPrevSet) {
      setNewSetWeight(nextPrevSet.weight.toString());
      setNewSetReps(nextPrevSet.reps.toString());
    }
  };

  const removeSet = (setNumber: number) => {
    const updatedSets = exerciseLog.sets
      .filter(s => s.setNumber !== setNumber)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    onUpdateLog({
      ...exerciseLog,
      sets: updatedSets,
    });
  };

  const updateNotes = (value: string) => {
    setExerciseNotes(value);
    onUpdateLog({
      ...exerciseLog,
      notes: value,
    });
  };

  // Check if we have any targets to display
  const hasTargets = targets && (targets.sets || targets.reps || targets.rir);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {exerciseName}
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
          <Badge variant={completedSets > 0 ? 'default' : 'outline'}>
            {completedSets}{targets?.sets ? `/${targets.sets}` : ''} sets
          </Badge>
        </div>

        {/* Targets Display */}
        {hasTargets && (
          <div className="mt-2 flex gap-4 text-sm">
            {targets.sets && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{targets.sets}</span> sets
              </span>
            )}
            {targets.reps && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{targets.reps}</span> reps
              </span>
            )}
            {targets.rir && (
              <span className="text-muted-foreground">
                RIR <span className="font-medium text-foreground">{targets.rir}</span>
              </span>
            )}
          </div>
        )}

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
        {/* Previous Workout Sets */}
        {previousSets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="h-4 w-4" />
              <span className="font-medium">Previous workout:</span>
            </div>
            <div className="grid gap-1 pl-6">
              {previousSets.map((set, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  Set {idx + 1}: {set.weight} kg × {set.reps}
                  {set.notes && <span className="italic ml-2">({set.notes})</span>}
                </div>
              ))}
              {previousNotes && (
                <div className="text-sm text-muted-foreground italic mt-1">
                  Notes: {previousNotes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Workout Sets */}
        {exerciseLog.sets.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Today:</div>
            {exerciseLog.sets.map((set) => (
              <div
                key={set.setNumber}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-8">#{set.setNumber}</span>
                  <span className="text-sm">{set.weight} kg</span>
                  <span className="text-sm">× {set.reps} reps</span>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeSet(set.setNumber)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Set */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Weight (kg)</label>
              <Input
                type="number"
                step="2.5"
                value={newSetWeight}
                onChange={(e) => setNewSetWeight(e.target.value)}
                placeholder={previousSets[0]?.weight.toString() || '0'}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Reps</label>
              <Input
                type="number"
                value={newSetReps}
                onChange={(e) => setNewSetReps(e.target.value)}
                placeholder={previousSets[0]?.reps.toString() || '0'}
                className="h-9"
              />
            </div>
            <Button onClick={addSet} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Set
            </Button>
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
        </div>
      </CardContent>
    </Card>
  );
}
