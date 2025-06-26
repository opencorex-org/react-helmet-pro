import { describe, expect, it } from 'vitest';

import { HelmetProvider } from '../src/context/HelmetProvider';
import { renderHook } from '@testing-library/react';
import { useHelmet } from '../src/hooks/useHelmet';

describe('useHelmet', () => {
  it('provides context', () => {
    const wrapper = ({ children }: any) => <HelmetProvider>{children}</HelmetProvider>;
    const { result } = renderHook(() => useHelmet(), { wrapper });
    expect(result.current).toHaveProperty('setHead');
  });
});
