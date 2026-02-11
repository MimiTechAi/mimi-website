const { exec } = require('child_process');
const fs = require('fs');

// Start the Next.js development server
console.log('Starting Next.js development server...');
const server = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Server error: ${error}`);
    return;
  }
  console.log(`Server stdout: ${stdout}`);
  console.error(`Server stderr: ${stderr}`);
});

// Wait for the server to start
setTimeout(() => {
  console.log('Running accessibility tests...');
  
  // Run pa11y accessibility tests
  exec('npx pa11y http://localhost:3000', (error, stdout, stderr) => {
    if (error) {
      console.error(`Accessibility tests failed: ${error}`);
      process.exit(1);
    }
    
    if (stdout.includes('No issues found!')) {
      console.log('Accessibility tests passed: No issues found');
    } else {
      console.error('Accessibility tests failed: Issues found');
      console.error(stdout);
      process.exit(1);
    }
    
    // Run Lighthouse tests
    console.log('Running Lighthouse tests...');
    exec('npx lighthouse http://localhost:3000 --output json --output-path lighthouse-report.json --quiet', (error, stdout, stderr) => {
      if (error) {
        console.error(`Lighthouse tests failed: ${error}`);
        process.exit(1);
      }
      
      // Read and parse the Lighthouse report
      fs.readFile('lighthouse-report.json', 'utf8', (err, data) => {
        if (err) {
          console.error(`Failed to read Lighthouse report: ${err}`);
          process.exit(1);
        }
        
        try {
          const report = JSON.parse(data);
          
          // Extract scores
          const performance = report.categories.performance.score;
          const accessibility = report.categories.accessibility.score;
          const bestPractices = report.categories['best-practices'].score;
          const seo = report.categories.seo.score;
          
          console.log('Lighthouse Scores:');
          console.log(`Performance: ${performance * 100}`);
          console.log(`Accessibility: ${accessibility * 100}`);
          console.log(`Best Practices: ${bestPractices * 100}`);
          console.log(`SEO: ${seo * 100}`);
          
          // Check if scores meet minimum thresholds
          const minScores = {
            performance: 70,
            accessibility: 90,
            bestPractices: 90,
            seo: 80
          };
          
          let passed = true;
          
          if (performance * 100 < minScores.performance) {
            console.error(`Performance score ${performance * 100} is below minimum ${minScores.performance}`);
            passed = false;
          }
          
          if (accessibility * 100 < minScores.accessibility) {
            console.error(`Accessibility score ${accessibility * 100} is below minimum ${minScores.accessibility}`);
            passed = false;
          }
          
          if (bestPractices * 100 < minScores.bestPractices) {
            console.error(`Best Practices score ${bestPractices * 100} is below minimum ${minScores.bestPractices}`);
            passed = false;
          }
          
          if (seo * 100 < minScores.seo) {
            console.error(`SEO score ${seo * 100} is below minimum ${minScores.seo}`);
            passed = false;
          }
          
          if (passed) {
            console.log('All Lighthouse tests passed!');
            process.exit(0);
          } else {
            console.error('Lighthouse tests failed due to low scores');
            process.exit(1);
          }
        } catch (parseError) {
          console.error(`Failed to parse Lighthouse report: ${parseError}`);
          process.exit(1);
        }
      });
    });
  });
}, 5000); // Wait 5 seconds for the server to start