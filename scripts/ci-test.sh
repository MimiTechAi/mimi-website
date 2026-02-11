#!/bin/bash

# CI/CD Test Script
# This script runs accessibility and Lighthouse tests in CI/CD environment

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting CI/CD tests..."

# Check if required commands are available
if ! command -v pa11y &> /dev/null; then
  echo " Installing pa11y..."
  npm install -g pa11y
fi

if ! command -v lighthouse &> /dev/null; then
  echo " Installing Lighthouse..."
  npm install -g lighthouse
fi

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Run accessibility tests
echo "🔍 Running accessibility tests..."
if pa11y http://localhost:3000; then
  echo "✅ Accessibility tests passed"
else
  echo "❌ Accessibility tests failed"
  exit 1
fi

# Run Lighthouse tests
echo "🔍 Running Lighthouse tests..."
if npx lighthouse http://localhost:3000 --output json --output-path lighthouse-report.json --quiet; then
  echo "✅ Lighthouse tests completed"
else
  echo "❌ Lighthouse tests failed"
  exit 1
fi

# Check Lighthouse scores
echo "📊 Checking Lighthouse scores..."
node << 'EOF'
const fs = require('fs');

if (!fs.existsSync('lighthouse-report.json')) {
  console.error('Lighthouse report not found');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync('lighthouse-report.json', 'utf8'));

const performance = report.categories.performance.score;
const accessibility = report.categories.accessibility.score;
const bestPractices = report.categories['best-practices'].score;
const seo = report.categories.seo.score;

console.log('\n=== Lighthouse Scores ===');
console.log(`Performance:     ${Math.round(performance * 100)}/100`);
console.log(`Accessibility:   ${Math.round(accessibility * 100)}/100`);
console.log(`Best Practices:  ${Math.round(bestPractices * 100)}/100`);
console.log(`SEO:             ${Math.round(seo * 100)}/100`);

// Minimum score requirements
const minScores = {
  performance: 70,
  accessibility: 90,
  bestPractices: 90,
  seo: 80
};

let passed = true;

if (performance * 100 < minScores.performance) {
  console.error(`\n❌ Performance score ${Math.round(performance * 100)} is below minimum ${minScores.performance}`);
  passed = false;
} else {
  console.log(`\n✅ Performance: ${Math.round(performance * 100)}/${minScores.performance}`);
}

if (accessibility * 100 < minScores.accessibility) {
  console.error(`❌ Accessibility score ${Math.round(accessibility * 100)} is below minimum ${minScores.accessibility}`);
  passed = false;
} else {
  console.log(`✅ Accessibility: ${Math.round(accessibility * 100)}/${minScores.accessibility}`);
}

if (bestPractices * 100 < minScores.bestPractices) {
  console.error(`❌ Best Practices score ${Math.round(bestPractices * 100)} is below minimum ${minScores.bestPractices}`);
  passed = false;
} else {
  console.log(`✅ Best Practices: ${Math.round(bestPractices * 100)}/${minScores.bestPractices}`);
}

if (seo * 100 < minScores.seo) {
  console.error(`❌ SEO score ${Math.round(seo * 100)} is below minimum ${minScores.seo}`);
  passed = false;
} else {
  console.log(`✅ SEO: ${Math.round(seo * 100)}/${minScores.seo}`);
}

if (passed) {
  console.log('\n🎉 All Lighthouse tests passed!');
  process.exit(0);
} else {
  console.error('\n💥 Lighthouse tests failed due to low scores');
  process.exit(1);
}
EOF

if [ $? -eq 0 ]; then
  echo "🎉 All CI/CD tests passed!"
  exit 0
else
  echo "💥 CI/CD tests failed!"
  exit 1
fi