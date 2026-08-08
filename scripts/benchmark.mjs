import { parseHtmlToHelmetState } from '../dist/cli/index.js';
import { mergeHelmet } from '../dist/index.js';
import { auditHelmetState } from '../dist/index.js';

// Setup mock data for benchmarks
const sampleHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Benchmark Page Title</title>
      <meta name="description" content="A high performance head manager for React." />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://example.com/benchmark" />
      <link rel="alternate" hreflang="en" href="https://example.com/en" />
      <link rel="alternate" hreflang="es" href="https://example.com/es" />
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Benchmark Product",
          "offers": {
            "@type": "Offer",
            "price": "49.99",
            "priceCurrency": "USD"
          }
        }
      </script>
    </head>
  </html>
`;

const stateA = parseHtmlToHelmetState(sampleHtml);
const stateB = {
  title: 'Updated Title',
  meta: [{ name: 'description', content: 'Updated description' }],
  link: [{ rel: 'canonical', href: 'https://example.com/updated' }],
};

const runBenchmark = (name, fn, iterations = 10000) => {
  // Warm up
  for (let i = 0; i < 1000; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSec = (1000 / avgTime).toFixed(0);

  console.log(
    `${name.padEnd(30)} | ${iterations.toString().padStart(10)} | ${totalTime.toFixed(2).padStart(8)} ms | ${avgTime.toFixed(4).padStart(8)} ms/op | ${Number(opsPerSec).toLocaleString().padStart(12)} ops/sec`
  );
};

console.log('========================================================================================');
console.log('React Helmet Pro Performance Benchmarks:');
console.log('========================================================================================');
console.log(
  `${'Benchmark'.padEnd(30)} | ${'Iterations'.padStart(10)} | ${'Total Time'.padStart(11)} | ${'Avg Latency'.padStart(11)} | ${'Throughput'.padStart(16)}`
);
console.log('========================================================================================');

runBenchmark('HTML parsing to HelmetState', () => {
  parseHtmlToHelmetState(sampleHtml);
});

runBenchmark('Helmet State merging (A + B)', () => {
  mergeHelmet(stateA, stateB);
});

runBenchmark('Helmet State SEO Auditing', () => {
  auditHelmetState(stateA, { rules: ['RHP_SEO_TITLE_TOO_SHORT', 'RHP_SEO_CANONICAL_MISSING'] });
});

console.log('========================================================================================');
