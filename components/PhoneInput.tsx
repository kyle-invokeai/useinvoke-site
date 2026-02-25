'use client';

import { useState, useCallback, useMemo } from 'react';

// Common country codes with emoji flags
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '(###) ###-####' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: '#### ######' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: '### ### ###' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: '#### #######' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '# ## ## ## ##' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: '## #### ####' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', format: '##### #####', nationalLength: 10 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', format: '(##) #####-####' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', format: '### ### ####' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', format: '### ### ###' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', format: '### #### ###' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', format: '# ########' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', format: '#### ####' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', format: '#### ####' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', format: '## #### ####' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', format: '### #### ####' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', format: '(###) ###-##-##' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', format: '## ### ####' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', format: '## ### ####' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', format: '## ### ####' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', format: '## ### ## ##' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', format: '##-### ## ##' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', format: '### ## ###' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', format: '#### ####' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', format: '## ### ## ##' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', format: '### ### ###' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', format: '### ## ## ##' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', format: '### ### ###' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', format: '### ### ###' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string, e164: string | null, isValid: boolean) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = '(415) 555-0123',
  error,
  className = ''
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // US default
  const [isInternational, setIsInternational] = useState(false);

  // Extract digits from input
  const extractDigits = useCallback((input: string): string => {
    return input.replace(/\D/g, '');
  }, []);

  // Format number according to country template
  const formatNumber = useCallback((digits: string, countryCode: string): string => {
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    const format = country.format;
    
    let result = '';
    let digitIndex = 0;
    
    for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
      if (format[i] === '#') {
        result += digits[digitIndex];
        digitIndex++;
      } else {
        result += format[i];
      }
    }
    
    return result;
  }, []);

  // Normalize to E.164
  const normalizeToE164 = useCallback((digits: string, countryCode: string): string | null => {
    if (digits.length < 7) return null;
    
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    const dialCode = country.dialCode.replace('+', '');
    
    // Check if digits already include country code
    if (digits.startsWith(dialCode)) {
      return `+${digits}`;
    }
    
    // Add country code
    return `+${dialCode}${digits}`;
  }, []);

  // Validate phone number
  const validatePhone = useCallback((digits: string, countryCode: string): boolean => {
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    const minLength = country.nationalLength || 10;
    const maxLength = 15; // E.164 max
    
    // For US/CA, we need exactly 10 digits (excluding country code)
    if (countryCode === 'US' || countryCode === 'CA') {
      return digits.length === 10;
    }
    
    // For other countries, use reasonable bounds
    return digits.length >= minLength && digits.length <= maxLength;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Check for international prefix
    if (raw.startsWith('+') && !isInternational) {
      setIsInternational(true);
    } else if (!raw.startsWith('+') && isInternational && raw.length === 0) {
      setIsInternational(false);
    }
    
    // Extract digits (preserve + if at start for international)
    let digits = extractDigits(raw);
    if (raw.startsWith('+') && digits.length > 0) {
      // Keep the + for international numbers
    }
    
    // Limit to 15 digits max (E.164 standard)
    if (digits.length > 15) {
      digits = digits.slice(0, 15);
    }
    
    // Format based on mode
    let formatted: string;
    if (isInternational || raw.startsWith('+')) {
      // International: just add + prefix
      formatted = digits.length > 0 ? `+${digits}` : '+';
    } else {
      // National: apply country formatting
      formatted = formatNumber(digits, selectedCountry.code);
    }
    
    // Calculate E.164 and validity
    const e164 = isInternational || raw.startsWith('+') 
      ? (digits.length >= 7 ? `+${digits}` : null)
      : normalizeToE164(digits, selectedCountry.code);
    const isValid = validatePhone(digits, selectedCountry.code);
    
    onChange(formatted, e164, isValid);
  }, [extractDigits, formatNumber, normalizeToE164, validatePhone, isInternational, selectedCountry, onChange]);

  // Handle country selection
  const handleCountrySelect = useCallback((country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setIsInternational(false);
    
    // Re-format existing digits with new country
    const digits = extractDigits(value);
    if (digits.length > 0) {
      const formatted = formatNumber(digits, country.code);
      const e164 = normalizeToE164(digits, country.code);
      const isValid = validatePhone(digits, country.code);
      onChange(formatted, e164, isValid);
    }
  }, [value, extractDigits, formatNumber, normalizeToE164, validatePhone, onChange]);

  // Handle + key for international
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '+' && value.length === 0) {
      setIsInternational(true);
    }
  }, [value.length]);

  const displayValue = useMemo(() => {
    if (isInternational || value.startsWith('+')) {
      return value;
    }
    return value;
  }, [value, isInternational]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-stretch">
        {/* Country Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-3 bg-slate-800 border border-slate-700 border-r-0 rounded-l-lg text-white hover:bg-slate-700 transition-colors min-w-[80px]"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm text-slate-300">{selectedCountry.dialCode}</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Phone Input */}
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isInternational ? '+1 415 555 0123' : placeholder}
          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Country Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 transition-colors text-left ${
                selectedCountry.code === country.code ? 'bg-slate-700' : ''
              }`}
            >
              <span className="text-lg">{country.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{country.name}</p>
                <p className="text-xs text-slate-400">{country.dialCode}</p>
              </div>
              {selectedCountry.code === country.code && (
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
