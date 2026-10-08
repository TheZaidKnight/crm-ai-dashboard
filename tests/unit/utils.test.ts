import { cn } from '@/lib/utils';

describe('Utility cn()', () => {
  it('should merge basic class names correctly', () => {
    const result = cn('btn', 'btn-primary');
    expect(result).toBe('btn btn-primary');
  });

  it('should handle conditional classes properly', () => {
    const isHidden = false;
    const isActive = true;
    const result = cn('base', isHidden && 'hidden', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should resolve conflicting Tailwind classes using tailwind-merge', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle empty or falsy inputs cleanly', () => {
    const result = cn('', null, undefined, false, 'text-sm');
    expect(result).toBe('text-sm');
  });
});
