import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WorkspaceSettings, SettingsProfile, SettingScope } from '../types/settings';
import { DEFAULT_SETTINGS, BUILT_IN_PROFILES } from '../types/settings';

interface SettingsContextType {
  settings: WorkspaceSettings;
  activeProfile: string;
  profiles: SettingsProfile[];
  updateSetting: (key: keyof WorkspaceSettings, value: any, scope?: SettingScope) => void;
  resetSettings: (scope?: SettingScope) => void;
  switchProfile: (profileId: string) => void;
  createProfile: (profile: SettingsProfile) => void;
  deleteProfile: (profileId: string) => void;
  exportSettings: () => string;
  importSettings: (json: string) => void;
  auditLog: AuditEntry[];
}

interface AuditEntry {
  timestamp: Date;
  key: string;
  oldValue: any;
  newValue: any;
  scope: SettingScope;
  user?: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);
  const [activeProfile, setActiveProfile] = useState<string>('default');
  const [profiles, setProfiles] = useState<SettingsProfile[]>(BUILT_IN_PROFILES);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('workspace-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse stored settings:', e);
      }
    }

    const storedProfiles = localStorage.getItem('settings-profiles');
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        setProfiles([...BUILT_IN_PROFILES, ...parsed]);
      } catch (e) {
        console.error('Failed to parse stored profiles:', e);
      }
    }

    const storedActiveProfile = localStorage.getItem('active-profile');
    if (storedActiveProfile) {
      setActiveProfile(storedActiveProfile);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('workspace-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof WorkspaceSettings, value: any, scope: SettingScope = 'workspace') => {
    const oldValue = settings[key];
    
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Add to audit log
    setAuditLog(prev => [
      ...prev,
      {
        timestamp: new Date(),
        key,
        oldValue,
        newValue: value,
        scope,
      },
    ]);

    console.log(`[Settings] Updated ${key}: ${oldValue} → ${value} (scope: ${scope})`);
  };

  const resetSettings = (scope?: SettingScope) => {
    if (scope === 'session') {
      // Clear session-scoped settings only
      console.log('[Settings] Reset session settings');
    } else if (scope === 'workspace') {
      setSettings(DEFAULT_SETTINGS);
      console.log('[Settings] Reset workspace settings');
    } else {
      // Reset everything
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('workspace-settings');
      localStorage.removeItem('active-profile');
      setActiveProfile('default');
      console.log('[Settings] Reset all settings');
    }
  };

  const switchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setSettings({ ...DEFAULT_SETTINGS, ...profile.settings });
      setActiveProfile(profileId);
      localStorage.setItem('active-profile', profileId);
      console.log(`[Settings] Switched to profile: ${profile.name}`);
    }
  };

  const createProfile = (profile: SettingsProfile) => {
    const newProfiles = [...profiles, profile];
    setProfiles(newProfiles);
    
    // Save custom profiles (exclude built-ins)
    const customProfiles = newProfiles.filter(p => !p.isBuiltIn);
    localStorage.setItem('settings-profiles', JSON.stringify(customProfiles));
    
    console.log(`[Settings] Created profile: ${profile.name}`);
  };

  const deleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile?.isBuiltIn) {
      console.warn('[Settings] Cannot delete built-in profile');
      return;
    }

    const newProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(newProfiles);

    // Save custom profiles
    const customProfiles = newProfiles.filter(p => !p.isBuiltIn);
    localStorage.setItem('settings-profiles', JSON.stringify(customProfiles));

    if (activeProfile === profileId) {
      switchProfile('default');
    }

    console.log(`[Settings] Deleted profile: ${profileId}`);
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      activeProfile,
      profiles: profiles.filter(p => !p.isBuiltIn),
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importSettings = (json: string) => {
    try {
      const imported = JSON.parse(json);
      
      if (imported.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...imported.settings });
      }
      
      if (imported.profiles) {
        setProfiles([...BUILT_IN_PROFILES, ...imported.profiles]);
      }
      
      if (imported.activeProfile) {
        setActiveProfile(imported.activeProfile);
      }

      console.log('[Settings] Imported settings successfully');
    } catch (e) {
      console.error('[Settings] Failed to import:', e);
      throw new Error('Invalid settings file');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        activeProfile,
        profiles,
        updateSetting,
        resetSettings,
        switchProfile,
        createProfile,
        deleteProfile,
        exportSettings,
        importSettings,
        auditLog,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
