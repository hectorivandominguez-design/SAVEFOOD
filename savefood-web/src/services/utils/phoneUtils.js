export const PHONE_COUNTRY_OPTIONS = [
  { value: '+57', label: 'Colombia (+57)', shortLabel: '+57', example: '300 123 4567', maxLength: 10 },
  { value: '+1', label: 'Estados Unidos / Canadá (+1)', shortLabel: '+1', example: '555 123 4567', maxLength: 10 },
  { value: '+34', label: 'España (+34)', shortLabel: '+34', example: '612 345 678', maxLength: 9 },
  { value: '+52', label: 'México (+52)', shortLabel: '+52', example: '55 1234 5678', maxLength: 10 },
  { value: '+51', label: 'Perú (+51)', shortLabel: '+51', example: '912 345 678', maxLength: 9 },
  { value: '+54', label: 'Argentina (+54)', shortLabel: '+54', example: '11 1234 5678', maxLength: 10 },
  { value: '+56', label: 'Chile (+56)', shortLabel: '+56', example: '9 1234 5678', maxLength: 9 },
];

const DEFAULT_COUNTRY_CODE = '+57';

function getCountryOption(countryCode) {
  return PHONE_COUNTRY_OPTIONS.find((option) => option.value === countryCode) || PHONE_COUNTRY_OPTIONS[0];
}

export function normalizeCountryCode(value) {
  return getCountryOption(value).value;
}

export function sanitizePhoneDigits(value, maxLength = 15) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}

export function extractPhoneParts(value, fallbackCountryCode = DEFAULT_COUNTRY_CODE) {
  const normalizedFallback = normalizeCountryCode(fallbackCountryCode);
  const raw = String(value || '').trim();

  if (!raw) {
    return { countryCode: normalizedFallback, localNumber: '' };
  }

  if (raw.startsWith('+')) {
    const normalizedRaw = raw.replace(/[^\d+]/g, '');
    const sortedCodes = [...PHONE_COUNTRY_OPTIONS]
      .map((option) => option.value)
      .sort((a, b) => b.length - a.length);

    const matchedCode = sortedCodes.find((code) => normalizedRaw.startsWith(code));

    if (matchedCode) {
      const localNumber = sanitizePhoneDigits(
        normalizedRaw.slice(matchedCode.length),
        getCountryOption(matchedCode).maxLength
      );

      return {
        countryCode: matchedCode,
        localNumber,
      };
    }
  }

  return {
    countryCode: normalizedFallback,
    localNumber: sanitizePhoneDigits(raw, getCountryOption(normalizedFallback).maxLength),
  };
}

export function buildInternationalPhone(countryCode, localNumber) {
  const normalizedCode = normalizeCountryCode(countryCode);
  const digits = sanitizePhoneDigits(localNumber, getCountryOption(normalizedCode).maxLength);

  if (!digits) {
    return '';
  }

  return `${normalizedCode}${digits}`;
}

export function getPhoneInputConfig(countryCode) {
  const option = getCountryOption(countryCode);

  return {
    maxLength: option.maxLength,
    placeholder: option.example,
    shortLabel: option.shortLabel,
  };
}

export function formatPhoneForDisplay(value, fallbackCountryCode = DEFAULT_COUNTRY_CODE) {
  const { countryCode, localNumber } = extractPhoneParts(value, fallbackCountryCode);

  if (!localNumber) {
    return '';
  }

  return `${countryCode} ${localNumber}`;
}

export function toWhatsAppPhone(value, fallbackCountryCode = DEFAULT_COUNTRY_CODE) {
  const { countryCode, localNumber } = extractPhoneParts(value, fallbackCountryCode);

  if (!localNumber) {
    return '';
  }

  return `${countryCode}${localNumber}`.replace(/\D/g, '');
}
