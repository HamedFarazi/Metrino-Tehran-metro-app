// JavaScript wrapper to run TypeScript migration
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== TEHRAN METRO DATA MIGRATION RUNNER ===\n');

try {
  // Check if TypeScript files exist
  const migrationScript = path.join(__dirname, '..', 'src', 'scripts', 'migrateData.ts');
  
  if (!fs.existsSync(migrationScript)) {
    console.error('❌ Migration script not found:', migrationScript);
    process.exit(1);
  }
  
  // First compile TypeScript
  console.log('1. Compiling TypeScript...');
  execSync('npx tsc src/scripts/migrateData.ts --outDir dist --module commonjs --target es2020', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // Run the compiled JavaScript
  console.log('\n2. Running migration...');
  const compiledScript = path.join(__dirname, '..', 'dist', 'scripts', 'migrateData.js');
  
  if (!fs.existsSync(compiledScript)) {
    console.error('❌ Compiled script not found:', compiledScript);
    process.exit(1);
  }
  
  // Run the migration
  require(compiledScript).migrateData().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Runner failed:', error);
  process.exit(1);
}