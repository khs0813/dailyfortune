export type AdFitPlacement =
  | 'home.afterSummary'
  | 'home.betweenDirectories'
  | 'today.afterSummary'
  | 'weekly.afterSummary'
  | 'monthly.afterSummary'
  | 'profile.afterSummary'
  | 'profile.midLife'
  | 'directory.mid';

export type AdFitVariant = {
  envKey: string;
  unit: string;
  width: number;
  height: number;
};

type PlacementVariantDefinition = Omit<AdFitVariant, 'unit'> & {
  fallbackEnvKeys?: string[];
};

type PlacementDefinition = {
  mobile?: PlacementVariantDefinition;
  desktop?: PlacementVariantDefinition;
};

export const adFitScriptSrc = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
export const defaultAdFitAllowedHosts = 'fortunedaily.co.kr,www.fortunedaily.co.kr';

const env = import.meta.env;
const readEnv = (key: string) => String(env[key] ?? '').trim();
const publicKey = (key: string) => `PUBLIC_${key}`;
const readFirstEnv = (keys: string[]) => keys.map(readEnv).find(Boolean) || '';

const definitions: Record<AdFitPlacement, PlacementDefinition> = {
  'home.afterSummary': {
    mobile: {
      envKey: publicKey('ADFIT_HOME_AFTER_SUMMARY_M_320X100'),
      fallbackEnvKeys: [publicKey('ADFIT_HOME_AFTER_RESULT_M_320X100')],
      width: 320,
      height: 100
    },
    desktop: {
      envKey: publicKey('ADFIT_HOME_AFTER_SUMMARY_D_728X90'),
      fallbackEnvKeys: [publicKey('ADFIT_HOME_AFTER_RESULT_D_728X90')],
      width: 728,
      height: 90
    }
  },
  'home.betweenDirectories': {
    mobile: { envKey: publicKey('ADFIT_HOME_BETWEEN_DIRECTORIES_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_HOME_BETWEEN_DIRECTORIES_D_728X90'), width: 728, height: 90 }
  },
  'today.afterSummary': {
    mobile: {
      envKey: publicKey('ADFIT_TODAY_AFTER_SUMMARY_M_320X100'),
      fallbackEnvKeys: [publicKey('ADFIT_TODAY_AFTER_RESULT_M_320X100')],
      width: 320,
      height: 100
    },
    desktop: {
      envKey: publicKey('ADFIT_TODAY_AFTER_SUMMARY_D_728X90'),
      fallbackEnvKeys: [publicKey('ADFIT_TODAY_AFTER_RESULT_D_728X90')],
      width: 728,
      height: 90
    }
  },
  'weekly.afterSummary': {
    mobile: {
      envKey: publicKey('ADFIT_WEEKLY_AFTER_SUMMARY_M_320X100'),
      fallbackEnvKeys: [publicKey('ADFIT_WEEKLY_AFTER_RESULT_M_320X100')],
      width: 320,
      height: 100
    },
    desktop: {
      envKey: publicKey('ADFIT_WEEKLY_AFTER_SUMMARY_D_728X90'),
      fallbackEnvKeys: [publicKey('ADFIT_WEEKLY_AFTER_RESULT_D_728X90')],
      width: 728,
      height: 90
    }
  },
  'monthly.afterSummary': {
    mobile: {
      envKey: publicKey('ADFIT_MONTHLY_AFTER_SUMMARY_M_320X100'),
      fallbackEnvKeys: [publicKey('ADFIT_MONTHLY_AFTER_RESULT_M_320X100')],
      width: 320,
      height: 100
    },
    desktop: {
      envKey: publicKey('ADFIT_MONTHLY_AFTER_SUMMARY_D_728X90'),
      fallbackEnvKeys: [publicKey('ADFIT_MONTHLY_AFTER_RESULT_D_728X90')],
      width: 728,
      height: 90
    }
  },
  'profile.afterSummary': {
    mobile: {
      envKey: publicKey('ADFIT_PROFILE_AFTER_SUMMARY_M_320X100'),
      fallbackEnvKeys: [publicKey('ADFIT_PROFILE_AFTER_RESULT_M_320X100')],
      width: 320,
      height: 100
    },
    desktop: {
      envKey: publicKey('ADFIT_PROFILE_AFTER_SUMMARY_D_728X90'),
      fallbackEnvKeys: [publicKey('ADFIT_PROFILE_AFTER_RESULT_D_728X90')],
      width: 728,
      height: 90
    }
  },
  'profile.midLife': {
    mobile: { envKey: publicKey('ADFIT_PROFILE_MID_LIFE_M_300X250'), width: 300, height: 250 },
    desktop: { envKey: publicKey('ADFIT_PROFILE_MID_LIFE_D_300X250'), width: 300, height: 250 }
  },
  'directory.mid': {
    mobile: { envKey: publicKey('ADFIT_DIRECTORY_MID_M_320X100'), width: 320, height: 100 },
    desktop: { envKey: publicKey('ADFIT_DIRECTORY_MID_D_728X90'), width: 728, height: 90 }
  }
};

const withUnit = (variant?: PlacementVariantDefinition): AdFitVariant | undefined => {
  if (!variant) return undefined;
  const { fallbackEnvKeys = [], ...base } = variant;
  return { ...base, unit: readFirstEnv([variant.envKey, ...fallbackEnvKeys]) };
};

export const isAdFitEnabled = () =>
  env.MODE !== 'test' && readEnv(publicKey('ADFIT_ENABLED')) === 'true';
export const getAdFitAllowedHosts = () =>
  readEnv(publicKey('ADFIT_ALLOWED_HOSTS')) || defaultAdFitAllowedHosts;

export const getAdFitPlacement = (placement: AdFitPlacement) => {
  const definition = definitions[placement];
  const mobile = withUnit(definition.mobile);
  const desktop = withUnit(definition.desktop);
  const variants = [mobile, desktop].filter(Boolean) as AdFitVariant[];
  const configuredVariants = variants.filter((variant) => variant.unit);
  const missingKeys = variants
    .filter((variant) => !variant.unit)
    .map((variant) => variant.envKey);

  return {
    placement,
    mobile,
    desktop,
    configuredVariants,
    missingKeys,
    hasAnyUnit: configuredVariants.length > 0
  };
};
