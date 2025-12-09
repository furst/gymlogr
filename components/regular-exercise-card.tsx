"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NumberStepper } from "@/components/ui/number-stepper";
import {
  Plus,
  X,
  History,
  ExternalLink,
  ChevronDown,
  Pencil,
  Check,
  Timer,
} from "lucide-react";
import { getLastExerciseSets } from "@/lib/db";
import type {
  ExerciseLog,
  SetLog,
  AlternativeExercise,
  RegularExerciseTargets,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  restTime?: string;
  programId?: string;
  weekNumber?: number;
  dayName?: string;
  onUpdateLog: (log: ExerciseLog) => void;
  index?: number; // For staggered animation
}

export function RegularExerciseCard({
  exerciseName,
  exerciseLog,
  lastSetIntensity,
  description,
  link,
  alternatives,
  targets,
  restTime,
  programId,
  weekNumber,
  dayName,
  onUpdateLog,
  index = 0,
}: RegularExerciseCardProps) {
  const [previousSets, setPreviousSets] = useState<PreviousSet[]>([]);
  const [previousNotes, setPreviousNotes] = useState<string | undefined>();
  const [newSetWeight, setNewSetWeight] = useState("");
  const [newSetReps, setNewSetReps] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState(exerciseLog.notes || "");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [recentlyAddedSet, setRecentlyAddedSet] = useState<number | null>(null);
  const [removingSet, setRemovingSet] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevSetsCountRef = useRef(exerciseLog.sets.length);
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadPreviousData = async () => {
      const data = await getLastExerciseSets(
        exerciseName,
        programId,
        weekNumber,
        dayName
      );
      if (data) {
        setPreviousSets(data.sets);
        setPreviousNotes(data.exerciseNotes);
        if (data.sets.length > 0 && !newSetWeight) {
          setNewSetWeight(data.sets[0].weight.toString());
          setNewSetReps(data.sets[0].reps.toString());
        }
      }
    };
    loadPreviousData();
  }, [exerciseName, programId, weekNumber, dayName]);

  // Track set count changes for success animation
  useEffect(() => {
    const targetSets = targets?.sets ? parseInt(targets.sets) : null;
    const currentCount = exerciseLog.sets.filter((s) => s.completed).length;
    const prevCount = prevSetsCountRef.current;

    if (targetSets && currentCount >= targetSets && prevCount < targetSets) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 600);
    }

    prevSetsCountRef.current = currentCount;
  }, [exerciseLog.sets, targets?.sets]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (notesSaveTimeoutRef.current) {
        clearTimeout(notesSaveTimeoutRef.current);
      }
    };
  }, []);

  const completedSets = exerciseLog.sets.filter((s) => s.completed).length;
  const targetSets = targets?.sets ? parseInt(targets.sets) : null;
  const progressPercentage = targetSets
    ? (completedSets / targetSets) * 100
    : 0;
  const isComplete = targetSets ? completedSets >= targetSets : false;

  const addSet = () => {
    const setNumber = exerciseLog.sets.length + 1;
    const newSet: SetLog = {
      setNumber,
      weight: parseFloat(newSetWeight) || 0,
      reps: parseInt(newSetReps) || 0,
      completed: true,
    };

    setRecentlyAddedSet(setNumber);
    setTimeout(() => setRecentlyAddedSet(null), 300);

    onUpdateLog({
      ...exerciseLog,
      sets: [...exerciseLog.sets, newSet],
    });

    const nextPrevSet = previousSets[exerciseLog.sets.length + 1];
    if (nextPrevSet) {
      setNewSetWeight(nextPrevSet.weight.toString());
      setNewSetReps(nextPrevSet.reps.toString());
    }
  };

  const removeSet = (setNumber: number) => {
    setRemovingSet(setNumber);

    setTimeout(() => {
      const updatedSets = exerciseLog.sets
        .filter((s) => s.setNumber !== setNumber)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      onUpdateLog({
        ...exerciseLog,
        sets: updatedSets,
      });
      setRemovingSet(null);
    }, 200);
  };

  const startEditSet = (set: SetLog) => {
    setEditingSet(set.setNumber);
    setEditWeight(set.weight.toString());
    setEditReps(set.reps.toString());
  };

  const saveEditSet = (setNumber: number) => {
    const updatedSets = exerciseLog.sets.map((s) =>
      s.setNumber === setNumber
        ? {
            ...s,
            weight: parseFloat(editWeight) || 0,
            reps: parseInt(editReps) || 0,
          }
        : s
    );

    onUpdateLog({
      ...exerciseLog,
      sets: updatedSets,
    });

    setEditingSet(null);
    setEditWeight("");
    setEditReps("");
  };

  const cancelEditSet = () => {
    setEditingSet(null);
    setEditWeight("");
    setEditReps("");
  };

  const updateNotes = (value: string) => {
    setExerciseNotes(value);

    // Clear any pending save timeout
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }

    // Debounce the save - wait 300ms after last keystroke
    notesSaveTimeoutRef.current = setTimeout(() => {
      onUpdateLog({
        ...exerciseLog,
        notes: value,
      });
    }, 300);
  };

  const hasTargets = targets && (targets.sets || targets.reps || targets.rir);

  return (
    <Card
      className={cn(
        "animate-slide-up transition-all duration-300",
        showSuccess && "ring-2 ring-green-500/50"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
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
                  className="text-muted-foreground hover:text-foreground transition-colors duration-150"
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
          <Badge
            variant={completedSets > 0 ? "default" : "outline"}
            className={cn(
              "transition-all duration-300 tabular-nums",
              isComplete && "bg-green-500 hover:bg-green-500/90"
            )}
          >
            {showSuccess && <Check className="h-3 w-3 mr-1 animate-scale-in" />}
            {completedSets}
            {targets?.sets ? `/${targets.sets}` : ""} sets
          </Badge>
        </div>

        {/* Progress bar for target sets */}
        {targetSets && (
          <div className="mt-3">
            <Progress
              value={completedSets}
              max={targetSets}
              className="h-1.5"
              indicatorClassName={cn(
                "transition-all duration-500",
                isComplete ? "bg-green-500" : "bg-primary"
              )}
            />
          </div>
        )}

        {/* Targets Display */}
        {hasTargets && (
          <div className="mt-2 flex gap-4 text-sm flex-wrap">
            {targets.sets && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {targets.sets}
                </span>{" "}
                sets
              </span>
            )}
            {targets.reps && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {targets.reps}
                </span>{" "}
                reps
              </span>
            )}
            {targets.rir && (
              <span className="text-muted-foreground">
                RIR{" "}
                <span className="font-medium text-foreground">
                  {targets.rir}
                </span>
              </span>
            )}
            {restTime && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span className="font-medium text-foreground">{restTime}</span>
              </span>
            )}
          </div>
        )}

        {/* Rest Time Display (when no other targets) */}
        {!hasTargets && restTime && (
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              <span className="font-medium text-foreground">{restTime}</span>
            </span>
          </div>
        )}

        {/* Alternatives Section */}
        {alternatives && alternatives.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <span
                className={cn(
                  "transition-transform duration-200",
                  showAlternatives && "rotate-180"
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
              {alternatives.length} alternative
              {alternatives.length > 1 ? "s" : ""}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                showAlternatives
                  ? "max-h-40 opacity-100 mt-2"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="pl-4 border-l-2 border-muted space-y-1">
                {alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="text-sm flex items-center gap-2 animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span>{alt.name}</span>
                    {alt.link && (
                      <a
                        href={alt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                  {set.notes && (
                    <span className="italic ml-2">({set.notes})</span>
                  )}
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
                className={cn(
                  "flex items-center justify-between p-2 bg-muted rounded-md transition-all duration-200",
                  recentlyAddedSet === set.setNumber &&
                    "animate-slide-up bg-green-500/10",
                  removingSet === set.setNumber &&
                    "animate-fade-out opacity-0 scale-95"
                )}
              >
                {editingSet === set.setNumber ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium tabular-nums">
                        Set #{set.setNumber}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => saveEditSet(set.setNumber)}
                          className="text-green-600 hover:text-green-600 hover:bg-green-500/10 press-effect"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={cancelEditSet}
                          className="press-effect"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberStepper
                        value={editWeight}
                        onChange={setEditWeight}
                        step={0.5}
                        min={0}
                        unit="kg"
                        autoFocus
                      />
                      <NumberStepper
                        value={editReps}
                        onChange={setEditReps}
                        step={1}
                        min={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditSet(set.setNumber);
                          if (e.key === "Escape") cancelEditSet();
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium w-8 tabular-nums">
                        #{set.setNumber}
                      </span>
                      <span className="text-sm tabular-nums">
                        {set.weight} kg
                      </span>
                      <span className="text-sm tabular-nums">
                        × {set.reps} reps
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEditSet(set)}
                        className="opacity-60 hover:opacity-100 transition-opacity press-effect"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => removeSet(set.setNumber)}
                        className="text-destructive opacity-60 hover:opacity-100 transition-opacity press-effect"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Set */}
        <div className="space-y-3 pt-2 border-t">
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper
              value={newSetWeight}
              onChange={setNewSetWeight}
              step={0.5}
              min={0}
              placeholder={previousSets[0]?.weight.toString() || "0"}
              label="Weight (kg)"
              unit="kg"
            />
            <NumberStepper
              value={newSetReps}
              onChange={setNewSetReps}
              step={1}
              min={0}
              placeholder={previousSets[0]?.reps.toString() || "0"}
              label="Reps"
              onKeyDown={(e) => {
                if (e.key === "Enter") addSet();
              }}
            />
          </div>
          <Button onClick={addSet} size="sm" className="w-full press-effect">
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Notes (optional)
            </label>
            <Input
              value={exerciseNotes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="How did it feel? Any observations..."
              className="h-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
