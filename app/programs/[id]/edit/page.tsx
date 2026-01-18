"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getProgram, saveProgram } from "@/lib/db";
import type {
  Program,
  ProgramWeek,
  WorkoutDay,
  ExerciseDefinition,
  AlternativeExercise,
} from "@/lib/types";

// Generate unique ID for exercises
function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ============ Alternative Exercise Editor ============
function AlternativeExerciseEditor({
  alternative,
  onUpdate,
  onRemove,
}: {
  alternative: AlternativeExercise;
  onUpdate: (alt: AlternativeExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-2">
        <Input
          placeholder="Alternative name"
          value={alternative.name}
          onChange={(e) => onUpdate({ ...alternative, name: e.target.value })}
        />
        <Input
          placeholder="Link (optional)"
          value={alternative.link || ""}
          onChange={(e) =>
            onUpdate({ ...alternative, link: e.target.value || undefined })
          }
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============ Exercise Editor ============
function ExerciseEditor({
  exercise,
  exerciseIndex,
  onUpdate,
  onRemove,
  onDuplicate,
  sbsLiftKeys,
}: {
  exercise: ExerciseDefinition;
  exerciseIndex: number;
  onUpdate: (exercise: ExerciseDefinition) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  sbsLiftKeys: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const updateField = <K extends keyof ExerciseDefinition>(
    field: K,
    value: ExerciseDefinition[K]
  ) => {
    onUpdate({ ...exercise, [field]: value });
  };

  const addAlternative = () => {
    const newAlternatives = [...(exercise.alternatives || []), { name: "" }];
    updateField("alternatives", newAlternatives);
  };

  const updateAlternative = (index: number, alt: AlternativeExercise) => {
    const newAlternatives = [...(exercise.alternatives || [])];
    newAlternatives[index] = alt;
    updateField("alternatives", newAlternatives);
  };

  const removeAlternative = (index: number) => {
    const newAlternatives = (exercise.alternatives || []).filter(
      (_, i) => i !== index
    );
    updateField(
      "alternatives",
      newAlternatives.length > 0 ? newAlternatives : undefined
    );
  };

  return (
    <Card className="border-l-4 border-l-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="text-sm text-muted-foreground">
                {exerciseIndex + 1}.
              </span>
              <CardTitle className="text-base flex-1">
                {exercise.name || "New Exercise"}
              </CardTitle>
              <Badge
                variant={exercise.type === "sbs" ? "default" : "secondary"}
              >
                {exercise.type === "sbs" ? "SBS" : "Regular"}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate exercise"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exercise Name</Label>
                <Input
                  value={exercise.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., Squat, Bench Press"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={exercise.type}
                  onValueChange={(value: "sbs" | "regular") => {
                    const updated: ExerciseDefinition = {
                      ...exercise,
                      type: value,
                    };
                    if (value === "sbs") {
                      updated.sbs_config = {
                        lift_key: exercise.name,
                        intensity_week_index: 0,
                      };
                      delete updated.targets;
                    } else {
                      updated.targets = { sets: "3", reps: "10", rir: "2" };
                      delete updated.sbs_config;
                    }
                    onUpdate(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sbs">SBS (Auto-regulated)</SelectItem>
                    <SelectItem value="regular">Regular (Sets/Reps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SBS Config */}
            {exercise.type === "sbs" && exercise.sbs_config && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                <div className="space-y-2">
                  <Label>Lift Key (for SBS settings lookup)</Label>
                  <Select
                    value={exercise.sbs_config.lift_key}
                    onValueChange={(value) =>
                      updateField("sbs_config", {
                        ...exercise.sbs_config!,
                        lift_key: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lift key" />
                    </SelectTrigger>
                    <SelectContent>
                      {sbsLiftKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Intensity Week Index</Label>
                  <Input
                    type="number"
                    min="0"
                    value={exercise.sbs_config.intensity_week_index}
                    onChange={(e) =>
                      updateField("sbs_config", {
                        ...exercise.sbs_config!,
                        intensity_week_index: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Regular Exercise Targets */}
            {exercise.type === "regular" && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-md">
                <div className="space-y-2">
                  <Label>Sets</Label>
                  <Input
                    value={exercise.targets?.sets || ""}
                    onChange={(e) =>
                      updateField("targets", {
                        ...exercise.targets,
                        sets: e.target.value,
                      })
                    }
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reps</Label>
                  <Input
                    value={exercise.targets?.reps || ""}
                    onChange={(e) =>
                      updateField("targets", {
                        ...exercise.targets,
                        reps: e.target.value,
                      })
                    }
                    placeholder="e.g., 8-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RIR</Label>
                  <Input
                    value={exercise.targets?.rir || ""}
                    onChange={(e) =>
                      updateField("targets", {
                        ...exercise.targets,
                        rir: e.target.value,
                      })
                    }
                    placeholder="e.g., 2"
                  />
                </div>
              </div>
            )}

            {/* Last Set Intensity */}
            <div className="space-y-2">
              <Label>Last Set Intensity Technique (optional)</Label>
              <Input
                value={exercise.lastSetIntensity || ""}
                onChange={(e) =>
                  updateField("lastSetIntensity", e.target.value || undefined)
                }
                placeholder="e.g., Drop set, Myo-reps, AMRAP"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description / Form Cues (optional)</Label>
              <Textarea
                value={exercise.description || ""}
                onChange={(e) =>
                  updateField("description", e.target.value || undefined)
                }
                placeholder="Notes about form, tempo, or execution"
                rows={2}
              />
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label>Video/Tutorial Link (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={exercise.link || ""}
                  onChange={(e) =>
                    updateField("link", e.target.value || undefined)
                  }
                  placeholder="https://..."
                />
                {exercise.link && (
                  <Button size="icon" variant="outline" asChild>
                    <a
                      href={exercise.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Rest Time */}
            <div className="space-y-2">
              <Label>Rest Time Between Sets (optional)</Label>
              <Input
                value={exercise.restTime || ""}
                onChange={(e) =>
                  updateField("restTime", e.target.value || undefined)
                }
                placeholder="e.g., 2 min, 90 sec, 2-3 min"
              />
            </div>

            {/* Alternatives */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Alternative Exercises</Label>
                <Button size="sm" variant="outline" onClick={addAlternative}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Alternative
                </Button>
              </div>
              {exercise.alternatives && exercise.alternatives.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2">
                  {exercise.alternatives.map((alt, index) => (
                    <AlternativeExerciseEditor
                      key={index}
                      alternative={alt}
                      onUpdate={(updated) => updateAlternative(index, updated)}
                      onRemove={() => removeAlternative(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============ Day Editor ============
function DayEditor({
  day,
  dayIndex,
  onUpdate,
  onRemove,
  sbsLiftKeys,
}: {
  day: WorkoutDay;
  dayIndex: number;
  onUpdate: (day: WorkoutDay) => void;
  onRemove: () => void;
  sbsLiftKeys: string[];
}) {
  const [isOpen, setIsOpen] = useState(true);

  const addExercise = (type: "sbs" | "regular") => {
    const newExercise: ExerciseDefinition = {
      id: generateExerciseId(),
      name: "",
      type,
      ...(type === "sbs"
        ? { sbs_config: { lift_key: "", intensity_week_index: 0 } }
        : { targets: { sets: "3", reps: "10", rir: "2" } }),
    };
    onUpdate({ ...day, exercises: [...day.exercises, newExercise] });
  };

  const updateExercise = (index: number, exercise: ExerciseDefinition) => {
    const newExercises = [...day.exercises];
    newExercises[index] = exercise;
    onUpdate({ ...day, exercises: newExercises });
  };

  const removeExercise = (index: number) => {
    const newExercises = day.exercises.filter((_, i) => i !== index);
    onUpdate({ ...day, exercises: newExercises });
  };

  const duplicateExercise = (index: number) => {
    const exerciseToDuplicate = day.exercises[index];
    const duplicated: ExerciseDefinition = {
      ...exerciseToDuplicate,
      id: generateExerciseId(),
      name: `${exerciseToDuplicate.name} (copy)`,
    };
    const newExercises = [...day.exercises];
    newExercises.splice(index + 1, 0, duplicated);
    onUpdate({ ...day, exercises: newExercises });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-lg flex-1">
                {day.name || `Day ${dayIndex + 1}`}
              </CardTitle>
              <Badge variant="outline">{day.exercises.length} exercises</Badge>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this day and all its exercises?")) {
                    onRemove();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Day Name */}
            <div className="space-y-2">
              <Label>Day Name</Label>
              <Input
                value={day.name}
                onChange={(e) => onUpdate({ ...day, name: e.target.value })}
                placeholder="e.g., Upper Body, Push Day"
              />
            </div>

            <Separator />

            {/* Exercises */}
            <div className="space-y-3">
              {day.exercises.map((exercise, index) => (
                <ExerciseEditor
                  key={exercise.id || index}
                  exercise={exercise}
                  exerciseIndex={index}
                  onUpdate={(ex) => updateExercise(index, ex)}
                  onRemove={() => removeExercise(index)}
                  onDuplicate={() => duplicateExercise(index)}
                  sbsLiftKeys={sbsLiftKeys}
                />
              ))}
            </div>

            {/* Add Exercise Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => addExercise("sbs")}>
                <Plus className="h-4 w-4 mr-1" />
                Add SBS Exercise
              </Button>
              <Button variant="outline" onClick={() => addExercise("regular")}>
                <Plus className="h-4 w-4 mr-1" />
                Add Regular Exercise
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============ Week Editor ============
function WeekEditor({
  week,
  weekIndex,
  onUpdate,
  onRemove,
  onDuplicate,
  sbsLiftKeys,
}: {
  week: ProgramWeek;
  weekIndex: number;
  onUpdate: (week: ProgramWeek) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  sbsLiftKeys: string[];
}) {
  const [isOpen, setIsOpen] = useState(weekIndex === 0);

  const addDay = () => {
    const newDay: WorkoutDay = {
      name: `Day ${week.days.length + 1}`,
      exercises: [],
    };
    onUpdate({ ...week, days: [...week.days, newDay] });
  };

  const updateDay = (index: number, day: WorkoutDay) => {
    const newDays = [...week.days];
    newDays[index] = day;
    onUpdate({ ...week, days: newDays });
  };

  const removeDay = (index: number) => {
    const newDays = week.days.filter((_, i) => i !== index);
    onUpdate({ ...week, days: newDays });
  };

  return (
    <Card className="border-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <CardTitle className="text-xl flex-1">
                Week {week.week_number}
              </CardTitle>
              <Badge>{week.days.length} days</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this week and all its days?")) {
                    onRemove();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-4">
            {week.days.map((day, index) => (
              <DayEditor
                key={index}
                day={day}
                dayIndex={index}
                onUpdate={(d) => updateDay(index, d)}
                onRemove={() => removeDay(index)}
                sbsLiftKeys={sbsLiftKeys}
              />
            ))}

            <Button variant="outline" onClick={addDay} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Add Day
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============ Main Page ============
export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sbsLiftKeys, setSbsLiftKeys] = useState<string[]>([]);

  // Load program and SBS settings
  useEffect(() => {
    async function load() {
      try {
        const prog = await getProgram(programId);
        if (!prog) {
          setError("Program not found");
          return;
        }
        setProgram(prog);

        // Load SBS lift keys from settings
        const res = await fetch("/sbs_settings.json");
        const sbsSettings = await res.json();
        const keys = Object.keys(sbsSettings.intensity_schedule || {}).filter(
          (k) => k !== "default"
        );
        setSbsLiftKeys(keys);
      } catch (err) {
        setError("Failed to load program");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [programId]);

  const handleSave = useCallback(async () => {
    if (!program) return;

    setSaving(true);
    try {
      await saveProgram(program);
      router.push("/programs");
    } catch (err) {
      setError("Failed to save program");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [program, router]);

  const addWeek = () => {
    if (!program) return;
    const newWeek: ProgramWeek = {
      week_number: program.weeks.length + 1,
      days: [],
    };
    setProgram({ ...program, weeks: [...program.weeks, newWeek] });
  };

  const updateWeek = (index: number, week: ProgramWeek) => {
    if (!program) return;
    const newWeeks = [...program.weeks];
    newWeeks[index] = week;
    setProgram({ ...program, weeks: newWeeks });
  };

  const removeWeek = (index: number) => {
    if (!program) return;
    const newWeeks = program.weeks.filter((_, i) => i !== index);
    // Renumber weeks
    newWeeks.forEach((w, i) => (w.week_number = i + 1));
    setProgram({ ...program, weeks: newWeeks });
  };

  const duplicateWeek = (index: number) => {
    if (!program) return;
    const weekToDuplicate = program.weeks[index];
    const duplicated: ProgramWeek = {
      ...JSON.parse(JSON.stringify(weekToDuplicate)),
      week_number: program.weeks.length + 1,
    };
    // Generate new IDs for all exercises
    duplicated.days.forEach((day) => {
      day.exercises.forEach((ex) => {
        ex.id = generateExerciseId();
      });
    });
    setProgram({ ...program, weeks: [...program.weeks, duplicated] });
  };

  const updateMax = (lift: string, value: number) => {
    if (!program) return;
    setProgram({
      ...program,
      settings: {
        ...program.settings,
        maxes: { ...program.settings.maxes, [lift]: value },
      },
    });
  };

  const addMax = (lift: string) => {
    if (!program || program.settings.maxes[lift] !== undefined) return;
    setProgram({
      ...program,
      settings: {
        ...program.settings,
        maxes: { ...program.settings.maxes, [lift]: 0 },
      },
    });
  };

  const removeMax = (lift: string) => {
    if (!program) return;
    const newMaxes = { ...program.settings.maxes };
    delete newMaxes[lift];
    setProgram({
      ...program,
      settings: { ...program.settings, maxes: newMaxes },
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !program) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
        <Button variant="outline" onClick={() => router.push("/programs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background py-4 z-10 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/programs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Program</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Program Info */}
      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Program Name</Label>
              <Input
                value={program.name}
                onChange={(e) =>
                  setProgram({ ...program, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={program.description || ""}
                onChange={(e) =>
                  setProgram({
                    ...program,
                    description: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={program.notes || ""}
              onChange={(e) =>
                setProgram({ ...program, notes: e.target.value || undefined })
              }
              placeholder="Notes displayed on the workout page (e.g., reminders, tips, focus areas)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maxes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Maxes</CardTitle>
            <div className="flex gap-2">
              <Input
                id="new-max-input"
                placeholder="Add new lift..."
                className="w-40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      addMax(input.value.trim());
                      input.value = "";
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById(
                    "new-max-input"
                  ) as HTMLInputElement;
                  if (input?.value.trim()) {
                    addMax(input.value.trim());
                    input.value = "";
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(program.settings.maxes).map(([lift, weight]) => (
              <div key={lift} className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{lift}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="2.5"
                      value={weight}
                      onChange={(e) =>
                        updateMax(lift, parseFloat(e.target.value) || 0)
                      }
                      className="h-8"
                    />
                    <span className="text-xs text-muted-foreground">kg</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive h-8 w-8"
                  onClick={() => removeMax(lift)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weeks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Training Weeks</h2>
          <Button onClick={addWeek}>
            <Plus className="h-4 w-4 mr-1" />
            Add Week
          </Button>
        </div>

        {program.weeks.map((week, index) => (
          <WeekEditor
            key={index}
            week={week}
            weekIndex={index}
            onUpdate={(w) => updateWeek(index, w)}
            onRemove={() => removeWeek(index)}
            onDuplicate={() => duplicateWeek(index)}
            sbsLiftKeys={sbsLiftKeys}
          />
        ))}

        {program.weeks.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No weeks yet. Click &quot;Add Week&quot; to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
