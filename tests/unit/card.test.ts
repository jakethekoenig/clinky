import { describe, test, expect } from 'bun:test';
import { parseCard } from '../../src/card';

describe('parseCard', () => {
  test('should parse a valid card', () => {
    const content = `Front content
Multiple lines

<!---split--->
Back content
Also multiple lines
% This is a comment`;

    const result = parseCard(content);
    expect(result.front).toBe('Front content\nMultiple lines');
    expect(result.back).toBe('Back content\nAlso multiple lines');
  });

  test('should filter out comment lines', () => {
    const content = `Front
<!---split--->
Back line 1
% Comment line
Back line 2`;

    const result = parseCard(content);
    expect(result.back).toBe('Back line 1\nBack line 2');
  });

  test('should throw error for invalid format', () => {
    const content = 'No separator here';
    expect(() => parseCard(content)).toThrow('Invalid card format');
  });
});
