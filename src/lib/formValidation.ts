// Form validation utilities with aria-describedby support

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | undefined;
}

interface ValidationRules {
  [field: string]: ValidationRule;
}

export class FormValidator {
  static validateField(
    value: string,
    fieldName: string,
    rules: ValidationRule
  ): string | undefined {
    // Required field check
    if (rules.required && !value.trim()) {
      return `${fieldName} ist erforderlich`;
    }

    // Minimum length check
    if (rules.minLength && value.trim().length < rules.minLength) {
      return `${fieldName} muss mindestens ${rules.minLength} Zeichen lang sein`;
    }

    // Maximum length check
    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return `${fieldName} darf maximal ${rules.maxLength} Zeichen lang sein`;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      return `Bitte geben Sie ein gültiges ${fieldName} ein`;
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return undefined;
  }

  static validateForm(
    data: Record<string, string>,
    rules: ValidationRules
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field in rules) {
      const error = this.validateField(data[field] || "", field, rules[field]);
      if (error) {
        errors.push({ field, message: error });
      }
    }

    return errors;
  }

  static getErrorId(field: string): string {
    return `${field}-error`;
  }

  static getDescriptionId(field: string): string {
    return `${field}-description`;
  }
}

// Predefined validation rules
export const validationRules = {
  name: {
    required: true,
    minLength: 2,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  message: {
    required: true,
    minLength: 10,
  },
  phone: {
    pattern: /^[\+]?[0-9\s\-\(\)]+$/,
  },
  company: {
    minLength: 2,
  },
};