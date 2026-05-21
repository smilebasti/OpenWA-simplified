import { ValueTransformer } from 'typeorm';

export const DateTransformer: ValueTransformer = {
  from: (value: string | Date | null): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  },
  to: (value: Date | null): string | null => {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : value;
  },
};
