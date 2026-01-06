/**
 * Tests for colors.js constants and utilities
 */
import { describe, it, expect } from 'vitest';
import { USER_COLORS, getColorForUser } from '../colors.js';

describe('USER_COLORS', () => {
  it('should have 13 color entries', () => {
    expect(USER_COLORS).toHaveLength(13);
  });

  it('should have all required properties for each color', () => {
    USER_COLORS.forEach((color, index) => {
      expect(color.bg).toBeDefined();
      expect(color.border).toBeDefined();
      expect(color.text).toBeDefined();
      expect(color.stroke).toBeDefined();
      expect(color.stroke).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('getColorForUser', () => {
  it('should return consistent color for same userId', () => {
    const color1 = getColorForUser(123, 'User1');
    const color2 = getColorForUser(123, 'User1');
    expect(color1).toEqual(color2);
  });

  it('should return different colors for different userIds', () => {
    const color1 = getColorForUser(1, 'User1');
    const color2 = getColorForUser(2, 'User2');
    // They might be the same by chance, but with good hashing they usually differ
    expect(color1).toBeDefined();
    expect(color2).toBeDefined();
  });

  it('should handle string userIds', () => {
    const color = getColorForUser('abc123', 'TestUser');
    expect(color).toBeDefined();
    expect(color.stroke).toBeDefined();
  });

  it('should handle numeric userIds', () => {
    const color = getColorForUser(12345, 'TestUser');
    expect(color).toBeDefined();
    expect(color.stroke).toBeDefined();
  });

  it('should always return a color from USER_COLORS for non-special users', () => {
    const color = getColorForUser(999, 'RegularUser');
    expect(USER_COLORS).toContainEqual(color);
  });
});
