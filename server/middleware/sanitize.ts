import validator from 'validator';

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  // Strip all HTML tags and escape special characters
  return validator.escape(input);
}

// Sanitize for plain text fields
export function sanitizeText(input: string): string {
  // Trim whitespace and normalize multiple spaces
  return input.trim().replace(/\s+/g, ' ');
}

// Sanitize URL
export function sanitizeUrl(input: string): string | null {
  if (!validator.isURL(input, { 
    protocols: ['http', 'https'],
    require_protocol: true 
  })) {
    return null;
  }
  return input;
}

// Sanitize email
export function sanitizeEmail(input: string): string | null {
  const normalized = validator.normalizeEmail(input);
  if (!normalized || !validator.isEmail(normalized)) {
    return null;
  }
  return normalized;
}

// Middleware to sanitize request body
export function sanitizeBody(req: any, res: any, next: any) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Trim whitespace but don't escape HTML here (will be done in specific validators)
      obj[key] = sanitizeText(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
