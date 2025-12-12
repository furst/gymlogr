"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Pencil,
  X,
  Save,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgramsPageSkeleton } from "@/components/ui/exercise-card-skeleton";
import {
  saveProgram,
  getAllPrograms,
  deleteProgram,
  getUserSettings,
  saveUserSettings,
  getProgram,
} from "@/lib/db";
import type { Program } from "@/lib/types";
import { cn } from "@/lib/utils";

function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function processProgram(program: Program): Program {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          id: exercise.id || generateExerciseId(),
        })),
      })),
    })),
  };
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMaxes, setEditingMaxes] = useState<string | null>(null);
  const [editedMaxes, setEditedMaxes] = useState<Record<string, number>>({});
  const [recentlyActivated, setRecentlyActivated] = useState<string | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      const [progs, settings] = await Promise.all([
        getAllPrograms(),
        getUserSettings(),
      ]);
      setPrograms(progs);
      setActiveProgramId(settings.activeProgramId || null);
    } catch (err) {
      setError("Failed to load programs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const rawProgram = JSON.parse(text) as Program;

      if (
        !rawProgram.name ||
        !rawProgram.settings?.maxes ||
        !rawProgram.weeks
      ) {
        throw new Error(
          "Invalid program format. Required: name, settings.maxes, weeks"
        );
      }

      const program = processProgram(rawProgram);

      await saveProgram(program);
      await loadData();

      event.target.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse program file"
      );
      console.error(err);
    }
  };

  const handleReplaceSquatWithSmithMachine = async () => {
    if (!activeProgramId) {
      setError("No active program selected");
      return;
    }

    // Default rest times for exercises
    const defaultRestTimes: Record<string, string> = {
      "Leg Press": "2-3 min",
      "Back Extension": "2-3 min",
      "Lean-back Lat Pulldown": "2-3 min",
      "Lean-Back Machine Pulldown": "2-3 min",
      "Standing Calf Raise": "1-2 min",
      "Chest-Supported Machine Row": "2-3 min",
      "Pec Deck": "1-2 min",
      "Triceps Pressdown(bar)": "1-2 min",
      "Ab Wheel Rollout": "1-2 min",
      "Lying Leg Curl": "1-2 min",
      "Hammer Curl": "1-2 min",
      "Hammer Preacher Curl": "1-2 min",
      "DB concentration curl": "1-2 min",
      "Single-Arm DB Row": "2-3 min",
      "Cable Lateral Raise": "1-2 min",
      "Face Pulls": "1-2 min",
      "Overhead Cable Triceps Extension (Bar)": "1-2 min",
      "Machine Crunch(BONUS)": "1-2 min",
      "Dual-Handle Lat Pulldown": "2-3 min",
      "Leg Extension": "1-2 min",
      "Bayesian Curl": "1-2 min",
    };

    try {
      const program = await getProgram(activeProgramId);
      if (!program) {
        setError("Active program not found");
        return;
      }

      const updatedProgram: Program = {
        ...program,
        weeks: program.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((exercise) => {
              if (exercise.name === "Squat") {
                return {
                  ...exercise,
                  name: "Smith Machine Squat",
                  type: "regular" as const,
                  sbs_config: undefined,
                  targets: {
                    sets: "3",
                    reps: "6-8",
                    rir: "1-2",
                  },
                  restTime: "3-5 min",
                  description:
                    "Once you are under the bar, set up your feet as you would a normal squat and then bring them forward ~3-6 inches. This will cause you to lean back into the bar slightly, allowing for a more upright squat, while also placing more tension on the quads. If your heels are raising at the bottom, you may need to bring your feet more forward. If your feet feel like they are slipping or your lower back is rounding at the bottom, try bringing your feet back a bit.",
                  link: "https://youtube.com/watch?v=J2D2J7RO_tA&feature=youtu.be",
                };
              }
              // Add default rest time if exercise matches and doesn't already have one
              const defaultRest = defaultRestTimes[exercise.name];
              if (defaultRest && !exercise.restTime) {
                return {
                  ...exercise,
                  restTime: defaultRest,
                };
              }
              return exercise;
            }),
          })),
        })),
      };

      await saveProgram(updatedProgram);
      await loadData();
      alert("Squat replaced with Smith Machine Squat!");
    } catch (err) {
      setError("Failed to replace exercise");
      console.error(err);
    }
  };

  const handleRemovePausedSquat = async () => {
    if (!activeProgramId) {
      setError("No active program selected");
      return;
    }

    try {
      const program = await getProgram(activeProgramId);
      if (!program) {
        setError("Active program not found");
        return;
      }

      // Standing Calf Raise definition (copied from other days)
      const standingCalfRaise = {
        id: generateExerciseId(),
        name: "Standing Calf Raise",
        type: "regular" as const,
        link: "https://www.youtube.com/watch?si=Q_4oyceNkI-WarRg&v=6lR2JdxUh7w&feature=youtu.be",
        lastSetIntensity: "Static Stretch (30s)",
        description:
          "1-2 second pause at the bottom of each rep. Instead of just going up onto your toes, think about rolling your ankle back and forth on the balls of your feet.",
        restTime: "1-2 min",
        targets: {
          sets: "3",
          reps: "12-15",
          rir: "0-2",
        },
      };

      // Seated Leg Curl definition
      const seatedLegCurl = {
        id: generateExerciseId(),
        name: "Seated Leg Curl (BONUS)",
        type: "regular" as const,
        link: "https://www.youtube.com/watch?si=Z1Cx7ih-vWTSTqq-&v=yv0aAY7M1mk&feature=youtu.be",
        lastSetIntensity: "Failure + LLPs (Extend set) every other week",
        description:
          "Lean forward over the machine to get a maximum stretch in your hamstrings.",
        restTime: "1-2 min",
        targets: {
          sets: "2",
          reps: "10-12",
          rir: "0-2",
        },
      };

      // Get the current highest intensity_week_index to continue from
      const currentWeekCount = program.weeks.length;

      // Update existing weeks: remove Paused Squat from Day 5 and add new exercises
      const updatedWeeks = program.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          if (day.name === "Day 5") {
            // Filter out Paused Squat and add Standing Calf Raise + Seated Leg Curl at the end
            const filteredExercises = day.exercises.filter(
              (exercise) => exercise.name !== "Paused Squat"
            );
            return {
              ...day,
              exercises: [
                ...filteredExercises,
                { ...standingCalfRaise, id: generateExerciseId() },
                { ...seatedLegCurl, id: generateExerciseId() },
              ],
            };
          }
          return day;
        }),
      }));

      // Create 2 additional weeks by cloning the last week with incremented intensity indices
      // Week 12 has index 11, so week 13 should have index 12, week 14 should have index 13
      const lastWeek = program.weeks[program.weeks.length - 1];
      const newWeeks = [1, 2].map((offset) => ({
        ...lastWeek,
        week_number: currentWeekCount + offset,
        days: lastWeek.days.map((day) => {
          // First update Day 5 to remove Paused Squat and add new exercises
          let exercises = day.exercises;
          if (day.name === "Day 5") {
            exercises = day.exercises.filter(
              (exercise) => exercise.name !== "Paused Squat"
            );
            exercises = [
              ...exercises,
              { ...standingCalfRaise, id: generateExerciseId() },
              { ...seatedLegCurl, id: generateExerciseId() },
            ];
          }

          // Then bump intensity_week_index for SBS exercises (increment by offset from last week)
          return {
            ...day,
            exercises: exercises.map((exercise) => {
              if (exercise.type === "sbs" && exercise.sbs_config) {
                return {
                  ...exercise,
                  id: generateExerciseId(),
                  sbs_config: {
                    ...exercise.sbs_config,
                    intensity_week_index:
                      exercise.sbs_config.intensity_week_index + offset,
                  },
                };
              }
              return {
                ...exercise,
                id: generateExerciseId(),
              };
            }),
          };
        }),
      }));

      // Remove Paused Squat from maxes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { "Paused Squat": _pausedSquatMax, ...remainingMaxes } =
        program.settings.maxes;

      const updatedProgram: Program = {
        ...program,
        settings: {
          ...program.settings,
          maxes: remainingMaxes,
        },
        weeks: [...updatedWeeks, ...newWeeks],
      };

      await saveProgram(updatedProgram);
      await loadData();
      alert("Paused Squat removed, exercises added, and 2 weeks extended!");
    } catch (err) {
      setError("Failed to modify program");
      console.error(err);
    }
  };

  const handleImportProgramReal2 = async () => {
    setError(null);

    try {
      const response = await fetch("/programreal2.json");
      if (!response.ok) {
        throw new Error("Failed to load programreal2.json");
      }

      const rawProgram = (await response.json()) as Program;

      if (
        !rawProgram.name ||
        !rawProgram.settings?.maxes ||
        !rawProgram.weeks
      ) {
        throw new Error(
          "Invalid program format. Required: name, settings.maxes, weeks"
        );
      }

      const program = processProgram(rawProgram);

      await saveProgram(program);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import programreal2.json"
      );
      console.error(err);
    }
  };

  const handleSetActive = async (programId: string) => {
    await saveUserSettings({ activeProgramId: programId, currentWeek: 1 });
    setActiveProgramId(programId);
    setRecentlyActivated(programId);
    setTimeout(() => setRecentlyActivated(null), 600);
  };

  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    await deleteProgram(programId);
    if (activeProgramId === programId) {
      await saveUserSettings({
        activeProgramId: undefined,
        currentWeek: undefined,
      });
      setActiveProgramId(null);
    }
    await loadData();
  };

  const handleEditMaxes = (program: Program) => {
    setEditingMaxes(program.id!);
    setEditedMaxes({ ...program.settings.maxes });
  };

  const handleCancelEdit = () => {
    setEditingMaxes(null);
    setEditedMaxes({});
  };

  const handleSaveMaxes = async (program: Program) => {
    const updatedProgram: Program = {
      ...program,
      settings: {
        ...program.settings,
        maxes: editedMaxes,
      },
    };

    await saveProgram(updatedProgram);
    await loadData();
    setEditingMaxes(null);
    setEditedMaxes({});
  };

  const handleMaxChange = (lift: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedMaxes((prev) => ({
      ...prev,
      [lift]: numValue,
    }));
  };

  if (loading) {
    return <ProgramsPageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            Upload and manage your training programs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleReplaceSquatWithSmithMachine}
            variant="outline"
            className="press-effect"
            disabled={!activeProgramId}
          >
            Replace Squat
          </Button>
          <Button
            onClick={handleRemovePausedSquat}
            variant="outline"
            className="press-effect"
            disabled={!activeProgramId}
          >
            Remove Paused Squat
          </Button>
          <Button
            onClick={handleImportProgramReal2}
            variant="outline"
            className="press-effect"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Default Program
          </Button>
          <label htmlFor="file-upload">
            <Button asChild className="press-effect">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload Program
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md animate-slide-down">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No programs uploaded yet. Upload a JSON program file to get
              started.
            </p>
            <label htmlFor="file-upload-empty">
              <Button variant="outline" asChild className="press-effect">
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Program
                </span>
              </Button>
              <input
                id="file-upload-empty"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program, index) => (
            <Card
              key={program.id}
              className={cn(
                "animate-slide-up transition-all duration-300",
                activeProgramId === program.id &&
                  "border-primary ring-1 ring-primary/20",
                recentlyActivated === program.id && "animate-success-pop"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {program.name}
                      {activeProgramId === program.id && (
                        <Badge variant="default" className="animate-scale-in">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    {program.description && (
                      <CardDescription>{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {activeProgramId !== program.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(program.id!)}
                        className="press-effect"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/programs/${program.id}/edit`)
                      }
                      className="press-effect"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit Program
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 press-effect"
                      onClick={() => handleDelete(program.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Weeks:</span>{" "}
                    <span className="font-medium tabular-nums">
                      {program.weeks.length}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Days/Week:</span>{" "}
                    <span className="font-medium tabular-nums">
                      {program.weeks[0]?.days.length || 0}
                    </span>
                  </div>
                </div>

                {/* Maxes Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Maxes</span>
                    {editingMaxes === program.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="press-effect"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveMaxes(program)}
                          className="press-effect"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMaxes(program)}
                        className="press-effect"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {editingMaxes === program.id ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                      {Object.entries(editedMaxes).map(([lift, weight]) => (
                        <div key={lift} className="space-y-1">
                          <Label htmlFor={`max-${lift}`} className="text-xs">
                            {lift}
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              id={`max-${lift}`}
                              type="number"
                              step="2.5"
                              value={weight}
                              onChange={(e) =>
                                handleMaxChange(lift, e.target.value)
                              }
                              className="h-8 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-xs text-muted-foreground">
                              kg
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      {Object.entries(program.settings.maxes).map(
                        ([lift, weight]) => (
                          <div
                            key={lift}
                            className="flex justify-between p-1.5 rounded bg-muted/30"
                          >
                            <span className="text-muted-foreground">
                              {lift}:
                            </span>
                            <span className="font-medium tabular-nums">
                              {weight} kg
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
