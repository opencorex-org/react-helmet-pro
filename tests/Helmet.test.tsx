import '@testing-library/jest-dom';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Helmet } from '../src/components/Helmet';
import { HelmetContext } from '../src/context/HelmetContext';
import { render } from '@testing-library/react';
import { updateTag } from '../src/core/HelmetManager';

vi.mock('../src/core/HelmetManager', () => ({
  updateTag: vi.fn((type, props) => {
    const tag = document.createElement(type);
    Object.keys(props).forEach((key) => {
      tag.setAttribute(key, props[key]);
    });
    document.head.appendChild(tag);
    return tag;
  }),
}));

describe('Head Component', () => {
  afterEach(() => {
    document.title = '';
    document.head.innerHTML = '';
    vi.clearAllMocks();
  });

  it('sets document title when provided', () => {
    render(
      <HelmetContext.Provider value={{ setHead: vi.fn() }}>
        <Helmet title="Test Title" />
      </HelmetContext.Provider>
    );
    expect(document.title).toBe('Test Title');
  });

  it('does not set document title when title is undefined', () => {
    render(
      <HelmetContext.Provider value={{ setHead: vi.fn() }}>
        <Helmet />
      </HelmetContext.Provider>
    );
    expect(document.title).toBe('');
  });

  it('adds meta tags to head', () => {
    render(
      <HelmetContext.Provider value={{ setHead: vi.fn() }}>
        <Helmet
          meta={[
            { name: 'description', content: 'Test Description' },
            { name: 'keywords', content: 'test, vitest' },
          ]}
        />
      </HelmetContext.Provider>
    );
    const metaDesc = document.querySelector('meta[name="description"]');
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    expect(metaDesc).toHaveAttribute('content', 'Test Description');
    expect(metaKeywords).toHaveAttribute('content', 'test, vitest');
    expect(vi.mocked(updateTag)).toHaveBeenCalledTimes(2);
  });

  it('removes meta tags on unmount', () => {
    const { unmount } = render(
      <HelmetContext.Provider value={{ setHead: vi.fn() }}>
        <Helmet meta={[{ name: 'description', content: 'Test' }]} />
      </HelmetContext.Provider>
    );
    expect(document.querySelector('meta')).not.toBeNull();
    unmount();
    expect(document.querySelector('meta')).toBeNull();
  });

  it('updates context with head data', () => {
    const setHeadSpy = vi.fn();
    render(
      <HelmetContext.Provider value={{ setHead: setHeadSpy }}>
        <Helmet title="Test Title" meta={[{ name: 'description', content: 'Test' }]} />
      </HelmetContext.Provider>
    );
    expect(setHeadSpy).toHaveBeenCalledWith({
      title: 'Test Title',
      meta: [{ name: 'description', content: 'Test' }],
    });
  });

  it('handles empty meta array', () => {
    render(
      <HelmetContext.Provider value={{ setHead: vi.fn() }}>
        <Helmet title="Test Title" meta={[]} />
      </HelmetContext.Provider>
    );
    expect(document.title).toBe('Test Title');
    expect(document.querySelector('meta')).toBeNull();
  });
});