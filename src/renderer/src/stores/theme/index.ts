import { computed, effectScope, onScopeDispose, ref, toRefs, watch } from 'vue'
import { usePreferredColorScheme } from '@vueuse/core'
import { defineStore } from 'pinia'
import { getPaletteColorByNumber } from '@/utils/color'
import { localStg } from '@/utils/storage'
import { themeSettings } from '@/theme/settings'

import {
  addThemeVarsToGlobal,
  createThemeToken, getNaiveTheme,
  toggleAuxiliaryColorModes,
  toggleCssDarkMode,
} from './shared'
import type { Ref } from 'vue'

/** Theme store */
export const useThemeStore = defineStore(
  'theme',
  () => {
    const scope = effectScope();
    const osTheme = usePreferredColorScheme();

    /** Theme settings */
    const settings: Ref<App.Theme.ThemeSetting> = ref(themeSettings);

    /** Optional NaiveUI theme overrides from preset */
    const naiveThemeOverrides: Ref<App.Theme.NaiveUIThemeOverride | undefined> = ref(undefined)

    /** Naive theme */
    const naiveTheme = computed(() =>
      getNaiveTheme(
        themeColors.value,
        settings.value,
        naiveThemeOverrides.value,
      ),
    );

    /** Dark mode */
    const darkMode = computed(() => {
      if (settings.value.themeScheme === "auto") {
        return osTheme.value === "dark";
      }
      return settings.value.themeScheme === "dark";
    });

    /** grayscale mode */
    const grayscaleMode = computed(() => settings.value.grayscale);

    /** colorWeakness mode */
    const colourWeaknessMode = computed(() => settings.value.colorWeakness);

    /** Theme colors */
    const themeColors = computed(() => {
      const { themeColor, otherColor, isInfoFollowPrimary } = settings.value;
      const colors: App.Theme.ThemeColor = {
        primary: themeColor,
        ...otherColor,
        info: isInfoFollowPrimary ? themeColor : otherColor.info,
      };
      return colors;
    });

    /**
     * Settings json
     *
     * It is for copy settings
     */
    const settingsJson = computed(() => JSON.stringify(settings.value));

    /** Reset store */
    function resetStore() {
      const themeStore = useThemeStore();

      themeStore.$reset();
    }

    /**
     * Set theme scheme
     *
     * @param themeScheme
     */
    function setThemeScheme(themeScheme: UnionKey.ThemeScheme) {
      settings.value.themeScheme = themeScheme;
    }

    /**
     * Set grayscale value
     *
     * @param isGrayscale
     */
    function setGrayscale(isGrayscale: boolean) {
      settings.value.grayscale = isGrayscale;
    }

    /**
     * Set colorWeakness value
     *
     * @param isColorWeakness
     */
    function setColorWeakness(isColorWeakness: boolean) {
      settings.value.colorWeakness = isColorWeakness;
    }

    /** Toggle theme scheme */
    function toggleThemeScheme() {
      const themeSchemes: UnionKey.ThemeScheme[] = ["light", "dark", "auto"];

      const index = themeSchemes.findIndex(
        (item) => item === settings.value.themeScheme,
      );

      const nextIndex = index === themeSchemes.length - 1 ? 0 : index + 1;

      const nextThemeScheme = themeSchemes[nextIndex];

      setThemeScheme(nextThemeScheme!);
    }

    /**
     * Update theme colors
     *
     * @param key Theme color key
     * @param color Theme color
     */
    function updateThemeColors(key: App.Theme.ThemeColorKey, color: string) {
      let colorValue = color;

      if (settings.value.recommendColor) {
        // get a color palette by provided color and color name, and use the suitable color

        colorValue = getPaletteColorByNumber(color, 500, true);
      }

      if (key === "primary") {
        settings.value.themeColor = colorValue;
      } else {
        settings.value.otherColor[key] = colorValue;
      }
    }

    /** Setup theme vars to global */
    function setupThemeVarsToGlobal() {
      const { themeTokens, darkThemeTokens } = createThemeToken(
        themeColors.value,
        settings.value.tokens,
        settings.value.recommendColor,
      );
      addThemeVarsToGlobal(themeTokens, darkThemeTokens);
    }

    // watch store
    scope.run(() => {
      // // watch dark mode
      watch(
        darkMode,
        (val) => {
          localStg.set("darkMode", val);
          toggleCssDarkMode(val);
        },
        { immediate: true },
      );

      watch(
        [grayscaleMode, colourWeaknessMode],
        (val) => {
          toggleAuxiliaryColorModes(val[0], val[1]);
        },
        { immediate: true },
      );

      // themeColors change, update css vars and storage theme color
      watch(
        themeColors,
        () => {
          setupThemeVarsToGlobal();
        },
        { immediate: true },
      );
    });

    /** On scope dispose */
    onScopeDispose(() => {
      scope.stop();
    });

    return {
      ...toRefs(settings.value),
      darkMode,
      themeColors,
      settingsJson,
      naiveTheme,
      setGrayscale,
      setColorWeakness,
      resetStore,
      setThemeScheme,
      toggleThemeScheme,
      updateThemeColors,
      setupThemeVarsToGlobal,
    };
  },
  {
    persist: true,
  },
)
