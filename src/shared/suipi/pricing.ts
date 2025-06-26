// Shared pricing utilities for PINS and profile registration

export interface PriceConfig {
  [key: string]: string | number | bigint;
}

// Constants matching the Move contract
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 64;

// Validate piNS name format exactly like the Move contract
export const isValidPiNSName = (name: string): boolean => {
  if (!name || name.length === 0) return false;
  
  const len = name.length;
  if (len < MIN_NAME_LENGTH || len > MAX_NAME_LENGTH) {
    return false;
  }

  // Check each character exactly like Move contract
  for (let i = 0; i < len; i++) {
    const charCode = name.charCodeAt(i);
    
    const isValid = 
      (charCode >= 0x61 && charCode <= 0x7A) || // a-z (lowercase only)
      (charCode >= 0x30 && charCode <= 0x39) || // 0-9
      (charCode === 0x2D);                      // - (hyphen)

    if (!isValid) {
      return false;
    }

    // No hyphen at beginning or end
    if ((i === 0 || i === len - 1) && charCode === 0x2D) {
      return false;
    }
  }

  return true;
};

// Get validation error message for piNS name (validates raw input)
export const getPiNSNameValidationError = (rawInput: string): string | null => {
  if (!rawInput || rawInput.length === 0) {
    return "Name is required";
  }
  
  // Reject inputs that contain @ or .pi since we want clean names only
  if (rawInput.includes('@')) {
    return "Invalid character|@";
  }
  
  if (rawInput.includes('.')) {
    return "Invalid character|.";
  }
  
  const cleanName = rawInput.trim();
  
  // Check length
  if (cleanName.length < MIN_NAME_LENGTH) {
    return "Name must be at least 1 character";
  }
  
  if (cleanName.length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  
  // Check for hyphens at start or end
  if (cleanName.startsWith('-') || cleanName.endsWith('-')) {
    return "Don't start or end with a hyphen";
  }
  
  // Check each character (matching Move contract exactly)
  for (let i = 0; i < cleanName.length; i++) {
    const charCode = cleanName.charCodeAt(i);
    
    const isValidChar = 
      (charCode >= 0x61 && charCode <= 0x7A) || // a-z (lowercase only)
      (charCode >= 0x30 && charCode <= 0x39) || // 0-9
      (charCode === 0x2D);                      // - (hyphen)

    if (!isValidChar) {
      const char = cleanName.charAt(i);
      if (charCode >= 0x41 && charCode <= 0x5A) { // A-Z
        return "Only lowercase letters are allowed - use lowercase instead";
      }
      return `Invalid character|${char}`;
    }
  }
  
  return null; // Valid name
};

// Calculate name registration price based on name length and lifetime
export const calculateNamePrice = (priceConfig: PriceConfig, name: string, lifetime: boolean): number => {
  const nameLength = name.length;
  
  // Price tiers based on name length (following common domain pricing patterns)
  let yearlyKey = "";
  let lifetimeKey = "";

  if (nameLength === 1) {
    yearlyKey = "p1_yearly";
    lifetimeKey = "p1_lifetime";
  } else if (nameLength === 2) {
    yearlyKey = "p2_yearly";
    lifetimeKey = "p2_lifetime";
  } else if (nameLength === 3) {
    yearlyKey = "p3_yearly";
    lifetimeKey = "p3_lifetime";
  } else if (nameLength === 4) {
    yearlyKey = "p4_yearly";
    lifetimeKey = "p4_lifetime";
  } else {
    yearlyKey = "p5_yearly";
    lifetimeKey = "p5_lifetime";
  }

  const yearlyPrice = priceConfig ? Number(priceConfig[yearlyKey] || 0) : 0;
  const lifetimePrice = priceConfig ? Number(priceConfig[lifetimeKey] || 0) : 0;
  
  return lifetime ? lifetimePrice : yearlyPrice;
};

// Legacy function - kept for backward compatibility but not needed anymore
// since we only accept pure names now
export const extractPiNSName = (input: string): string => {
  if (!input) return "";
  
  // Remove @ prefix if present
  let name = input.startsWith('@') ? input.substring(1) : input;
  
  // Remove .pi suffix if present
  name = name.endsWith('.pi') ? name.substring(0, name.length - 3) : name;
  
  return name;
};

// Format piNS name for display (@name.pi)
export const formatPiNSName = (name: string): string => {
  if (!name) return "";
  
  // Format as @name.pi
  return `@${name}.pi`;
}; 