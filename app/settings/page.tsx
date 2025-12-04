'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserSettings, saveUserSettings, clearAllData } from '@/lib/db';
import type { UserSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    weightIncrement: 2.5,
    unit: 'kg',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getUserSettings();
      setSettings(data);
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
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      return;
    }
    if (!confirm('This will delete all programs, workout history, and settings. Continue?')) {
      return;
    }

    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weight Settings</CardTitle>
          <CardDescription>Configure how weights are rounded and displayed</CardDescription>
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
                setSettings({ ...settings, weightIncrement: parseFloat(e.target.value) || 2.5 })
              }
              className="max-w-[200px]"
            />
            <p className="text-sm text-muted-foreground">
              Weights will be rounded to the nearest increment
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearData}>
            Delete All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
