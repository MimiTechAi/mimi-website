#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit', ...options });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Function to parse Lighthouse report and display scores
function displayLighthouseScores() {
  if (!fileExists('lighthouse-report.json')) {
    console.error('Lighthouse report not found');
    return;
  }
  
  try {
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
    
    // Check against minimum scores
    const minScores = {
      performance: 70,
      accessibility: 90,
      bestPractices: 90,
      seo: 80
    };
    
    console.log('\n=== Score Requirements ===');
    console.log(`Performance:     ${performance * 100 >= minScores.performance ? '✅' : '❌'} Minimum ${minScores.performance}`);
    console.log(`Accessibility:   ${accessibility * 100 >= minScores.accessibility ? '✅' : '❌'} Minimum ${minScores.accessibility}`);
    console.log(`Best Practices:  ${bestPractices * 100 >= minScores.bestPractices ? '✅' : '❌'} Minimum ${minScores.bestPractices}`);
    console.log(`SEO:             ${seo * 100 >= minScores.seo ? '✅' : '❌'} Minimum ${minScores.seo}`);
    
  } catch (error) {
    console.error('Failed to parse Lighthouse report:', error.message);
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log('🚀 Starting automated tests...\n');
  
  try {
    // Run Pa11y accessibility tests
    console.log('🔍 Running accessibility tests with Pa11y...');
    await runCommand('npx', ['pa11y', 'http://localhost:3000']);
    console.log('✅ Accessibility tests completed\n');
    
    // Run Lighthouse tests
    console.log('🔍 Running Lighthouse performance tests...');
    await runCommand('npx', [
      'lighthouse',
      'http://localhost:3000',
      '--output', 'json',
      '--output-path', 'lighthouse-report.json',
      '--quiet'
    ]);
    console.log('✅ Lighthouse tests completed\n');
    
    // Display scores
    displayLighthouseScores();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests();