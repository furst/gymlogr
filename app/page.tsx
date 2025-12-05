"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SBSExerciseCard } from "@/components/sbs-exercise-card";
import { RegularExerciseCard } from "@/components/regular-exercise-card";
import { WorkoutPageSkeleton } from "@/components/ui/exercise-card-skeleton";
import {
  getProgram,
  getUserSettings,
  saveUserSettings,
  saveWorkoutSession,
  getWorkoutSessionForDay,
  getPreviousDayComment,
} from "@/lib/db";
import {
  getSBSPrescription,
  type SBSPrescription,
} from "@/lib/sbs-calculations";
import type { Program, ExerciseLog, WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function WorkoutPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeDay, setActiveDay] = useState<string>("");
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(
    null
  );
  const [prescriptions, setPrescriptions] = useState<
    Record<string, SBSPrescription>
  >({});
  const [loading, setLoading] = useState(true);
  const [weekTransition, setWeekTransition] = useState<"left" | "right" | null>(
    null
  );
  const [contentKey, setContentKey] = useState(0); // For triggering re-animation
  const prevWeekRef = useRef(currentWeek);
  const [previousComment, setPreviousComment] = useState<string | null>(null);
  const commentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCommentSaveRef = useRef<(() => Promise<void>) | null>(null);

  const loadWorkoutSession = useCallback(
    async (
      prog: Program,
      programId: string,
      weekNumber: number,
      dayName: string
    ) => {
      // Load previous comment for this day
      const prevComment = await getPreviousDayComment(
        programId,
        dayName,
        weekNumber
      );
      setPreviousComment(prevComment);

      const existing = await getWorkoutSessionForDay(
        programId,
        weekNumber,
        dayName
      );

      if (existing) {
        setWorkoutSession(existing);
        return;
      }

      // Create new session
      const weekData = prog.weeks.find((w) => w.week_number === weekNumber);
      const dayData = weekData?.days.find((d) => d.name === dayName);

      if (!dayData) return;

      const exercises: ExerciseLog[] = dayData.exercises.map((ex) => ({
        exerciseId: ex.id!,
        exerciseName: ex.name,
        type: ex.type,
        sets: [],
      }));

      const newSession: WorkoutSession = {
        programId,
        weekNumber,
        dayName,
        date: new Date(),
        exercises,
        completed: false,
        startedAt: new Date(),
      };

      setWorkoutSession(newSession);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      const settings = await getUserSettings();

      if (!settings.activeProgramId) {
        setLoading(false);
        return;
      }

      const prog = await getProgram(settings.activeProgramId);
      if (!prog) {
        setLoading(false);
        return;
      }

      setProgram(prog);
      const week = settings.currentWeek || 1;
      setCurrentWeek(week);

      const weekData = prog.weeks.find((w) => w.week_number === week);
      if (weekData && weekData.days.length > 0) {
        const savedDay = settings.currentDay;
        const dayExists =
          savedDay && weekData.days.some((d) => d.name === savedDay);
        const dayName = dayExists ? savedDay : weekData.days[0].name;
        setActiveDay(dayName);

        const presc: Record<string, SBSPrescription> = {};
        for (const day of weekData.days) {
          for (const exercise of day.exercises) {
            if (exercise.type === "sbs" && exercise.sbs_config && exercise.id) {
              presc[exercise.id] = getSBSPrescription(
                exercise.sbs_config.lift_key,
                week - 1,
                prog.settings,
                settings.weightIncrement
              );
            }
          }
        }
        setPrescriptions(presc);

        await loadWorkoutSession(prog, settings.activeProgramId, week, dayName);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [loadWorkoutSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle week transition animation
  useEffect(() => {
    if (prevWeekRef.current !== currentWeek) {
      const direction = currentWeek > prevWeekRef.current ? "right" : "left";
      setWeekTransition(direction);
      setContentKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setWeekTransition(null);
      }, 300);

      prevWeekRef.current = currentWeek;
      return () => clearTimeout(timer);
    }
  }, [currentWeek]);

  const handleDayChange = async (dayName: string) => {
    if (!program || !workoutSession) return;

    // Flush any pending comment save before navigating
    await flushPendingCommentSave();

    // Trigger content re-animation
    setContentKey((prev) => prev + 1);
    setActiveDay(dayName);
    await saveUserSettings({ currentDay: dayName });

    await loadWorkoutSession(
      program,
      workoutSession.programId,
      currentWeek,
      dayName
    );
  };

  const handleWeekChange = async (delta: number) => {
    if (!program) return;

    const newWeek = Math.max(
      1,
      Math.min(currentWeek + delta, program.weeks.length)
    );
    if (newWeek === currentWeek) return;

    // Flush any pending comment save before navigating
    await flushPendingCommentSave();

    setCurrentWeek(newWeek);

    const weekData = program.weeks.find((w) => w.week_number === newWeek);
    if (weekData && weekData.days.length > 0) {
      const dayExists = weekData.days.some((d) => d.name === activeDay);
      const dayName = dayExists ? activeDay : weekData.days[0].name;
      setActiveDay(dayName);

      await saveUserSettings({ currentWeek: newWeek, currentDay: dayName });

      const settings = await getUserSettings();
      const presc: Record<string, SBSPrescription> = {};
      for (const day of weekData.days) {
        for (const exercise of day.exercises) {
          if (exercise.type === "sbs" && exercise.sbs_config && exercise.id) {
            presc[exercise.id] = getSBSPrescription(
              exercise.sbs_config.lift_key,
              newWeek - 1,
              program.settings,
              settings.weightIncrement
            );
          }
        }
      }
      setPrescriptions(presc);

      await loadWorkoutSession(
        program,
        settings.activeProgramId!,
        newWeek,
        dayName
      );
    }
  };

  const handleUpdateExerciseLog = async (
    exerciseId: string,
    log: ExerciseLog
  ) => {
    if (!workoutSession) return;

    const updatedExercises = workoutSession.exercises.map((ex) =>
      ex.exerciseId === exerciseId ? log : ex
    );

    const updatedSession = {
      ...workoutSession,
      exercises: updatedExercises,
    };

    try {
      const savedId = await saveWorkoutSession(updatedSession);
      // Update local state with the returned ID to ensure subsequent saves update the same record
      setWorkoutSession({ ...updatedSession, id: savedId });
    } catch (err) {
      console.error("Failed to auto-save workout:", err);
      // Still update local state even if save fails, but without ID
      setWorkoutSession(updatedSession);
    }
  };

  const handleCommentChange = (comment: string) => {
    if (!workoutSession) return;

    const updatedSession = {
      ...workoutSession,
      comment,
    };

    // Update local state immediately for responsive UI
    setWorkoutSession(updatedSession);

    // Clear any pending save timeout
    if (commentSaveTimeoutRef.current) {
      clearTimeout(commentSaveTimeoutRef.current);
    }

    // Store the save function so we can flush it on navigation
    const saveFunction = async () => {
      try {
        const savedId = await saveWorkoutSession(updatedSession);
        // Update local state with the returned ID to ensure subsequent saves update the same record
        setWorkoutSession((prev) => (prev ? { ...prev, id: savedId } : null));
      } catch (err) {
        console.error("Failed to save comment:", err);
      }
      pendingCommentSaveRef.current = null;
    };

    pendingCommentSaveRef.current = saveFunction;

    // Debounce the save - wait 300ms after last keystroke
    commentSaveTimeoutRef.current = setTimeout(saveFunction, 300);
  };

  // Flush any pending comment save (call before navigation)
  const flushPendingCommentSave = async () => {
    if (commentSaveTimeoutRef.current) {
      clearTimeout(commentSaveTimeoutRef.current);
      commentSaveTimeoutRef.current = null;
    }
    if (pendingCommentSaveRef.current) {
      await pendingCommentSaveRef.current();
    }
  };

  if (loading) {
    return <WorkoutPageSkeleton />;
  }

  if (!program) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Program</h2>
        <p className="text-muted-foreground mb-4">
          Upload and select a program to start your workout.
        </p>
        <Button asChild className="press-effect">
          <Link href="/programs">Go to Programs</Link>
        </Button>
      </div>
    );
  }

  const weekData = program.weeks.find((w) => w.week_number === currentWeek);

  const totalCompletedSets =
    workoutSession?.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWeekChange(-1)}
          disabled={currentWeek <= 1}
          className="press-effect transition-all duration-150 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          className={cn(
            "text-center transition-all duration-300",
            weekTransition === "right" && "animate-slide-in-right",
            weekTransition === "left" && "animate-slide-in-left"
          )}
        >
          <h1 className="text-xl font-bold">{program.name}</h1>
          <p className="text-muted-foreground tabular-nums">
            Week{" "}
            <span className="font-semibold text-foreground">{currentWeek}</span>{" "}
            of {program.weeks.length}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWeekChange(1)}
          disabled={currentWeek >= program.weeks.length}
          className="press-effect transition-all duration-150 hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Tabs */}
      {weekData && (
        <Tabs value={activeDay} onValueChange={handleDayChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {weekData.days.map((day, index) => (
              <TabsTrigger
                key={day.name}
                value={day.name}
                className="transition-all duration-200 data-[state=active]:shadow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {day.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {weekData.days.map((day) => (
            <TabsContent
              key={`${day.name}-${contentKey}`}
              value={day.name}
              className="space-y-4 mt-4 animate-fade-in"
            >
              {/* Comment input */}
              <div className="space-y-1">
                <Input
                  placeholder={
                    previousComment
                      ? `Previous: ${previousComment}`
                      : "Add a comment (e.g., gym location)..."
                  }
                  value={workoutSession?.comment || ""}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  className="text-sm"
                />
                {previousComment && !workoutSession?.comment && (
                  <p className="text-xs text-muted-foreground px-1">
                    Last time: {previousComment}
                  </p>
                )}
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="transition-all duration-200"
                >
                  {day.exercises.length} exercises
                </Badge>
                <Badge
                  variant={totalCompletedSets > 0 ? "default" : "secondary"}
                  className={cn(
                    "transition-all duration-300 tabular-nums",
                    totalCompletedSets > 0 && "animate-pulse-scale"
                  )}
                >
                  {totalCompletedSets} sets logged
                </Badge>
              </div>

              {/* Exercise Cards */}
              <div className="space-y-4">
                {day.exercises.map((exercise, index) => {
                  if (!exercise.id) return null;

                  const exerciseLog = workoutSession?.exercises.find(
                    (ex) => ex.exerciseId === exercise.id
                  );

                  if (!exerciseLog) return null;

                  if (exercise.type === "sbs" && prescriptions[exercise.id]) {
                    return (
                      <SBSExerciseCard
                        key={exercise.id}
                        exerciseName={exercise.name}
                        prescription={prescriptions[exercise.id]}
                        exerciseLog={exerciseLog}
                        lastSetIntensity={exercise.lastSetIntensity}
                        description={exercise.description}
                        link={exercise.link}
                        alternatives={exercise.alternatives}
                        onUpdateLog={(log) =>
                          handleUpdateExerciseLog(exercise.id!, log)
                        }
                        index={index}
                      />
                    );
                  }

                  return (
                    <RegularExerciseCard
                      key={exercise.id}
                      exerciseName={exercise.name}
                      exerciseLog={exerciseLog}
                      lastSetIntensity={exercise.lastSetIntensity}
                      description={exercise.description}
                      link={exercise.link}
                      alternatives={exercise.alternatives}
                      targets={exercise.targets}
                      programId={workoutSession?.programId}
                      weekNumber={currentWeek}
                      dayName={activeDay}
                      onUpdateLog={(log) =>
                        handleUpdateExerciseLog(exercise.id!, log)
                      }
                      index={index}
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
