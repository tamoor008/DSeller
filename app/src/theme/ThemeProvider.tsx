import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeColors,
  ThemeMode,
  applyThemeColors,
  themePalettes,
} from '../constants/AppColors';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: themePalettes.light,
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

const STORAGE_KEY = '@dseller/theme-preference';

export const ThemeProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const lastAppliedMode = useRef<ThemeMode>();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) {
          if (storedMode === 'light' || storedMode === 'dark') {
            setMode(storedMode);
          } else {
            const systemPreference = Appearance.getColorScheme();
            if (systemPreference === 'dark') {
              setMode('dark');
            }
          }
        }
      } catch {
        // ignore hydration errors and fall back to default
      } finally {
        if (isMounted) {
          setHasBootstrapped(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const colors = useMemo<ThemeColors>(() => {
    return { ...themePalettes[mode] };
  }, [mode]);

  if (lastAppliedMode.current !== mode) {
    applyThemeColors(colors);
    lastAppliedMode.current = mode;
  }

  useEffect(() => {
    if (!hasBootstrapped) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => undefined);
  }, [mode, hasBootstrapped]);

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'light' ? 'dark' : 'light');
  }, [mode, setTheme]);

  const value = useMemo(
    () => ({
      mode,
      colors,
      setTheme,
      toggleTheme,
    }),
    [mode, colors, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

