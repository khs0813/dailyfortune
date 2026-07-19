export type AdFitPlacement =
  | 'home.afterResult'
  | 'home.betweenDirectories'
  | 'today.afterResult'
  | 'weekly.afterResult'
  | 'monthly.afterResult'
  | 'profile.afterResult'
  | 'profile.afterLife'
  | 'profile.mid'
  | 'profile.side'
  | 'directory.afterGrid'
  | 'guide.mid';

export type AdFitVariant = {
  envKey: string;
  unit: string;
  width: number;
  height: number;
};

type PlacementDefinition = {
  mobile?: Omit<AdFitVariant, 'unit'>;
  desktop?: Omit<AdFitVariant, 'unit'>;
  desktopFallback?: Omit<AdFitVariant, 'unit'>;
};

export const adFitScriptSrc = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
export const defaultAdFitAllowedHosts = 'fortunedaily.co.kr,www.fortunedaily.co.kr';

const env = import.meta.env;
const readEnv = (key: string) => String(env[key] ?? '').trim();
const publicKey = (key: string) => `PUBLIC_${key}`;

const definitions: Record<AdFitPlacement, PlacementDefinition> = {
  'home.afterResult': {
    mobile: { envKey: publicKey('ADFIT_HOME_AFTER_RESULT_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_HOME_AFTER_RESULT_D_728X90'), width: 728, height: 90 },
    desktopFallback: { envKey: publicKey('ADFIT_HOME_AFTER_RESULT_D_300X250'), width: 300, height: 250 }
  },
  'home.betweenDirectories': {
    mobile: { envKey: publicKey('ADFIT_HOME_BETWEEN_DIRECTORIES_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_HOME_BETWEEN_DIRECTORIES_D_728X90'), width: 728, height: 90 },
    desktopFallback: { envKey: publicKey('ADFIT_HOME_BETWEEN_DIRECTORIES_D_300X250'), width: 300, height: 250 }
  },
  'today.afterResult': {
    mobile: { envKey: publicKey('ADFIT_TODAY_AFTER_RESULT_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_TODAY_AFTER_RESULT_D_728X90'), width: 728, height: 90 }
  },
  'weekly.afterResult': {
    mobile: { envKey: publicKey('ADFIT_WEEKLY_AFTER_RESULT_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_WEEKLY_AFTER_RESULT_D_728X90'), width: 728, height: 90 }
  },
  'monthly.afterResult': {
    mobile: { envKey: publicKey('ADFIT_MONTHLY_AFTER_RESULT_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_MONTHLY_AFTER_RESULT_D_728X90'), width: 728, height: 90 }
  },
  'profile.afterResult': {
    mobile: { envKey: publicKey('ADFIT_PROFILE_AFTER_RESULT_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_PROFILE_AFTER_RESULT_D_728X90'), width: 728, height: 90 }
  },
  'profile.afterLife': {
    mobile: { envKey: publicKey('ADFIT_PROFILE_AFTER_LIFE_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_PROFILE_AFTER_LIFE_D_300X250'), width: 300, height: 250 }
  },
  'profile.mid': {
    mobile: { envKey: publicKey('ADFIT_PROFILE_MID_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_PROFILE_MID_D_300X250'), width: 300, height: 250 }
  },
  'profile.side': {
    desktop: { envKey: publicKey('ADFIT_PROFILE_SIDE_D_160X600'), width: 160, height: 600 }
  },
  'directory.afterGrid': {
    mobile: { envKey: publicKey('ADFIT_DIRECTORY_AFTER_GRID_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_DIRECTORY_AFTER_GRID_D_728X90'), width: 728, height: 90 }
  },
  'guide.mid': {
    mobile: { envKey: publicKey('ADFIT_GUIDE_MID_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_GUIDE_MID_D_300X250'), width: 300, height: 250 }
  }
};

const withUnit = (variant?: Omit<AdFitVariant, 'unit'>): AdFitVariant | undefined => {
  if (!variant) return undefined;
  return { ...variant, unit: readEnv(variant.envKey) };
};

export const isAdFitEnabled = () =>
  env.MODE !== 'test' && readEnv(publicKey('ADFIT_ENABLED')) === 'true';
export const getAdFitAllowedHosts = () =>
  readEnv(publicKey('ADFIT_ALLOWED_HOSTS')) || defaultAdFitAllowedHosts;
export const isAdFitProfileThirdEnabled = () =>
  readEnv(publicKey('ADFIT_PROFILE_THIRD_ENABLED')) === 'true';
export const isAdFitDesktopSideRailEnabled = () =>
  readEnv(publicKey('ADFIT_DESKTOP_SIDE_RAIL_ENABLED')) === 'true';

export const getAdFitPlacement = (placement: AdFitPlacement) => {
  const definition = definitions[placement];
  const mobile = withUnit(definition.mobile);
  const desktop = withUnit(definition.desktop);
  const desktopFallback = withUnit(definition.desktopFallback);
  const variants = [mobile, desktop, desktopFallback].filter(Boolean) as AdFitVariant[];
  const configuredVariants = variants.filter((variant) => variant.unit);
  const missingKeys = variants
    .filter((variant) => !variant.unit)
    .map((variant) => variant.envKey);

  return {
    placement,
    mobile,
    desktop,
    desktopFallback,
    configuredVariants,
    missingKeys,
    hasAnyUnit: configuredVariants.length > 0
  };
};
