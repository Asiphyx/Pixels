import { MemoryEntry } from '@shared/schema';

/**
 * Safely parse JSON with special handling for dates
 * @param jsonString String to parse
 * @returns Parsed object or empty array if failed
 */
export function safeJsonParse<T>(jsonString: string | any): T {
  if (!jsonString) {
    return [] as unknown as T;
  }
  
  // If already an object, return it
  if (typeof jsonString !== 'string') {
    return jsonString as T;
  }

  try {
    // Parse the JSON string
    const parsed = JSON.parse(jsonString, (key, value) => {
      // Check if the value looks like an ISO date string
      if (typeof value === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
        return new Date(value);
      }
      return value;
    });
    
    // Validate the parsed result is what we expect
    if (Array.isArray(parsed) || typeof parsed === 'object') {
      return parsed as T;
    }
    
    // If not, return empty array
    return [] as unknown as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [] as unknown as T;
  }
}

/**
 * Safely stringify objects with special handling for dates
 * @param data Object to stringify
 * @returns JSON string or empty array string if failed
 */
export function safeJsonStringify<T>(data: T): string {
  try {
    // Stringify with a replacer for dates
    return JSON.stringify(data, (key, value) => {
      // If it's a Date, convert to ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  } catch (error) {
    console.error('Error stringifying object:', error);
    return '[]';
  }
}

/**
 * Validate memory entries array
 * @param memories Array of memory entries
 * @returns Validated memory entries array
 */
export function validateMemoryEntries(memories: any[]): MemoryEntry[] {
  if (!Array.isArray(memories)) {
    return [];
  }
  
  return memories.filter(entry => {
    // Basic validation that it has required properties
    return entry && 
           typeof entry === 'object' && 
           typeof entry.content === 'string' &&
           typeof entry.type === 'string';
  }).map(entry => {
    // Ensure timestamp is a Date
    if (entry.timestamp && !(entry.timestamp instanceof Date)) {
      entry.timestamp = new Date(entry.timestamp);
    } else if (!entry.timestamp) {
      entry.timestamp = new Date();
    }
    
    // Ensure importance is a number between 1-5
    if (typeof entry.importance !== 'number' || 
        entry.importance < 1 || 
        entry.importance > 5) {
      entry.importance = 3; // Default importance
    }
    
    return entry as MemoryEntry;
  });
}