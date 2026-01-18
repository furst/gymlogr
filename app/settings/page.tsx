"use client";

import { useState, useEffect } from "react";
import { Save, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUserSettings, saveUserSettings, clearAllData, getProgram, saveProgram } from "@/lib/db";
import type { UserSettings, Program } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    weightIncrement: 2.5,
    unit: "kg",
  });
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [programNotes, setProgramNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getUserSettings();
      setSettings(data);
      
      // Load active program for notes editing
      if (data.activeProgramId) {
        const program = await getProgram(data.activeProgramId);
        if (program) {
          setActiveProgram(program);
          setProgramNotes(program.notes || "");
        }
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUserSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeProgram) return;
    
    setSavingNotes(true);
    try {
      await saveProgram({
        ...activeProgram,
        notes: programNotes || undefined,
      });
      setActiveProgram({ ...activeProgram, notes: programNotes || undefined });
      setSavedNotes(true);
      setTimeout(() => setSavedNotes(false), 2000);
    } catch (err) {
      console.error("Failed to save program notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all data? This cannot be undone."
      )
    ) {
      return;
    }
    if (
      !confirm(
        "This will delete all programs, workout history, and settings. Continue?"
      )
    ) {
      return;
    }

    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your preferences</p>
      </div>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Weight Settings</CardTitle>
          <CardDescription>
            Configure how weights are rounded and displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="increment">Weight Increment (kg)</Label>
            <Input
              id="increment"
              type="number"
              step="0.5"
              value={settings.weightIncrement}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  weightIncrement: parseFloat(e.target.value) || 2.5,
                })
              }
              className="max-w-[200px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-sm text-muted-foreground">
              Weights will be rounded to the nearest increment
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "press-effect transition-all duration-300",
              saved && "bg-green-600 hover:bg-green-600"
            )}
          >
            {saved ? (
              <Check className="h-4 w-4 mr-2 animate-scale-in" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Program Notes */}
      {activeProgram && (
        <Card className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <CardHeader>
            <CardTitle>Program Notes</CardTitle>
            <CardDescription>
              Notes for &quot;{activeProgram.name}&quot; - displayed on the workout page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about your program (e.g., reminders, tips, focus areas)..."
                value={programNotes}
                onChange={(e) => setProgramNotes(e.target.value)}
                rows={3}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className={cn(
                "press-effect transition-all duration-300",
                savedNotes && "bg-green-600 hover:bg-green-600"
              )}
            >
              {savedNotes ? (
                <Check className="h-4 w-4 mr-2 animate-scale-in" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingNotes ? "Saving..." : savedNotes ? "Saved!" : "Save Notes"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card
        className="border-destructive/50 animate-slide-up"
        style={{ animationDelay: activeProgram ? "100ms" : "50ms" }}
      >
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleClearData}
            className="press-effect"
          >
            Delete All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
