"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Minus,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import type { ExerciseLog, AlternativeExercise } from "@/lib/types";
import type { SBSPrescription } from "@/lib/sbs-calculations";
import { getSetsPerWeekLogic } from "@/lib/sbs-calculations";
import { cn } from "@/lib/utils";

interface SBSExerciseCardProps {
  exerciseName: string;
  prescription: SBSPrescription;
  exerciseLog: ExerciseLog;
  lastSetIntensity?: string;
  description?: string;
  link?: string;
  alternatives?: AlternativeExercise[];
  onUpdateLog: (log: ExerciseLog) => void;
  index?: number; // For staggered animation
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
  index = 0,
}: SBSExerciseCardProps) {
  const [setsCompleted, setSetsCompleted] = useState<number>(
    exerciseLog.setsCompleted ?? 0
  );
  const [exerciseNotes, setExerciseNotes] = useState(exerciseLog.notes || "");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevSetsRef = useRef(setsCompleted);
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setGoalLogic = getSetsPerWeekLogic(prescription.liftKey);
  const setGoalMin = setGoalLogic.default_range.min;
  const setGoalMax = setGoalLogic.default_range.max;

  // Calculate progress percentage (0-100)
  const progressPercentage = Math.min(100, (setsCompleted / setGoalMax) * 100);
  const isInTargetRange =
    setsCompleted >= setGoalMin && setsCompleted <= setGoalMax;

  // Animate counter changes
  useEffect(() => {
    if (prevSetsRef.current !== setsCompleted) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200);

      // Show success animation when reaching target
      if (setsCompleted >= setGoalMin && prevSetsRef.current < setGoalMin) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 600);
      }

      prevSetsRef.current = setsCompleted;
      return () => clearTimeout(timer);
    }
  }, [setsCompleted, setGoalMin]);

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

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (notesSaveTimeoutRef.current) {
        clearTimeout(notesSaveTimeoutRef.current);
      }
    };
  }, []);

  // Determine status based on sets completed vs goal
  const getSetStatus = () => {
    if (setsCompleted === 0) return "pending";
    if (setsCompleted >= setGoalMin && setsCompleted <= setGoalMax)
      return "on-target";
    if (setsCompleted > setGoalMax) return "above";
    return "below";
  };

  const status = getSetStatus();
  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    "on-target":
      "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30",
    above:
      "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    below:
      "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30",
  };

  const progressColors = {
    pending: "bg-muted-foreground/30",
    "on-target": "bg-green-500",
    above: "bg-blue-500",
    below: "bg-orange-500",
  };

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
              <Badge
                variant="secondary"
                className="transition-colors duration-200"
              >
                SBS
              </Badge>
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
          {/* Compact progress indicator in header */}
          <div className="flex flex-col items-end gap-1">
            <div
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-300",
                setsCompleted >= setGoalMin
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {setsCompleted}/{setGoalMin}-{setGoalMax}
            </div>
          </div>
        </div>

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
        {/* Prescription Display */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="space-y-1 p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold tabular-nums">
              {prescription.weight}
            </div>
            <div className="text-xs text-muted-foreground">Weight (kg)</div>
          </div>
          <div className="space-y-1 p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold tabular-nums">
              {prescription.targetReps}
            </div>
            <div className="text-xs text-muted-foreground">Reps</div>
          </div>
          <div className="space-y-1 p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold tabular-nums">
              {prescription.targetRIR}
            </div>
            <div className="text-xs text-muted-foreground">RIR cutoff</div>
          </div>
          <div className="space-y-1 p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold tabular-nums">
              {setGoalMin}-{setGoalMax}
            </div>
            <div className="text-xs text-muted-foreground">Set goal</div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          value={setsCompleted}
          max={setGoalMax}
          className="h-2"
          indicatorClassName={cn(
            "transition-all duration-500",
            progressColors[status]
          )}
        />

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
                className="press-effect transition-all duration-150 hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div
                className={cn(
                  "px-4 py-2 rounded-md min-w-[70px] text-center font-bold tabular-nums transition-all duration-300",
                  statusColors[status],
                  isAnimating && "animate-number-pop"
                )}
              >
                <span className="flex items-center justify-center gap-1">
                  {setsCompleted}
                  {showSuccess && (
                    <Check className="h-4 w-4 animate-scale-in text-green-600 dark:text-green-400" />
                  )}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => updateSetsCompleted(setsCompleted + 1)}
                className="press-effect transition-all duration-150 hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              setsCompleted > 0
                ? "max-h-10 opacity-100 mt-2"
                : "max-h-0 opacity-0"
            )}
          >
            <div className="text-sm text-right">
              {status === "on-target" && (
                <span className="text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                  <Check className="h-3.5 w-3.5" />
                  On target - maintain TM
                </span>
              )}
              {status === "above" && (
                <span className="text-blue-600 dark:text-blue-400">
                  Above range - increase TM
                </span>
              )}
              {status === "below" && (
                <span className="text-orange-600 dark:text-orange-400">
                  Below range - decrease TM
                </span>
              )}
            </div>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}
