import '@testing-library/jest-dom';

import { describe, expect, it } from 'vitest';

import { StructuredData } from '../src/components/StructuredData';
import { render } from '@testing-library/react';

describe('StructuredData', () => {
  it('injects JSON-LD script tag', () => {
    const json = { '@type': 'Organization', name: 'Test Org' };
    render(<StructuredData json={json} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toContain('"name":"Test Org"');
  });
});