import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Helmet } from '../src/components/Helmet';
import { HelmetProvider } from '../src/context/HelmetProvider';
import { HelmetData } from '../src/core/HelmetData';
import { safeJsonLdStringify } from '../src/next/jsonLd';

describe('Security Regressions & Request Isolation Suite', () => {
  beforeEach(() => {
    HelmetProvider.canUseDOM = false;
  });

  afterEach(() => {
    HelmetProvider.canUseDOM = true;
  });

  describe('XSS Injection & Escaping Prevention', () => {
    it('escapes and sanitizes unsafe title content, preventing title context breakouts', () => {
      const helmetData = new HelmetData({});
      const titleInput = '</title><script>alert("xss")</script>';
      
      renderToString(
        <HelmetProvider context={helmetData.context}>
          <Helmet>
            <title>{titleInput}</title>
          </Helmet>
        </HelmetProvider>
      );
      
      const { helmet } = helmetData.context;
      expect(helmet!.title.toString()).toContain('&lt;/title&gt;&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('escapes unsafe attribute values in meta tags', () => {
      const helmetData = new HelmetData({});
      const unsafeContent = 'description" content="breakout" style="color:red" data-xss="';
      
      renderToString(
        <HelmetProvider context={helmetData.context}>
          <Helmet>
            <meta name="description" content={unsafeContent} />
          </Helmet>
        </HelmetProvider>
      );
      
      const { helmet } = helmetData.context;
      expect(helmet!.meta.toString()).toContain('content="description&quot; content=&quot;breakout&quot; style=&quot;color:red&quot; data-xss=&quot;"');
    });

    it('XSS prevention in structured data using safeJsonLdStringify', () => {
      const unsafePayload = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '</script><script>alert("injected")</script>',
      };
      
      const serialized = safeJsonLdStringify(unsafePayload);
      expect(serialized).not.toContain('</script>');
      expect(serialized).toContain('\\u003c/script>'); // Escaped format
    });
  });

  describe('CSP (Content Security Policy) Support', () => {
    it('injects nonces to script and style tags correctly', () => {
      const helmetData = new HelmetData({});
      const cspNonce = 'xyz-random-nonce-123';
      
      renderToString(
        <HelmetProvider context={helmetData.context}>
          <Helmet>
            <script type="text/javascript" nonce={cspNonce}>
              {`console.log("secure script")`}
            </script>
            <style nonce={cspNonce}>
              {`body { background: red; }`}
            </style>
          </Helmet>
        </HelmetProvider>
      );
      
      const { helmet } = helmetData.context;
      expect(helmet!.script.toString()).toContain(`nonce="${cspNonce}"`);
      expect(helmet!.style.toString()).toContain(`nonce="${cspNonce}"`);
    });
  });

  describe('Concurrent SSR Request Isolation', () => {
    it('ensures that concurrent async render requests have strictly isolated states', async () => {
      const runRequest = async (id: number, delayMs: number) => {
        const helmetData = new HelmetData({});
        
        // Wait representing asynchronous database/network loader retrieval
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        
        renderToString(
          <HelmetProvider context={helmetData.context}>
            <Helmet>
              <title>{`Request ${id} Title`}</title>
              <meta name="request-id" content={String(id)} />
            </Helmet>
          </HelmetProvider>
        );
        
        return helmetData.context.helmet;
      };

      // Run multiple concurrent rendering tasks with staggered delays
      const promises = [
        runRequest(1, 30),
        runRequest(2, 10),
        runRequest(3, 20),
        runRequest(4, 5),
      ];

      const results = await Promise.all(promises);

      // Verify that states are fully isolated and not bleeding or overlapping
      expect(results[0]!.title.toString()).toContain('Request 1 Title');
      expect(results[0]!.meta.toString()).toContain('content="1"');

      expect(results[1]!.title.toString()).toContain('Request 2 Title');
      expect(results[1]!.meta.toString()).toContain('content="2"');

      expect(results[2]!.title.toString()).toContain('Request 3 Title');
      expect(results[2]!.meta.toString()).toContain('content="3"');

      expect(results[3]!.title.toString()).toContain('Request 4 Title');
      expect(results[3]!.meta.toString()).toContain('content="4"');
    });
  });
});
