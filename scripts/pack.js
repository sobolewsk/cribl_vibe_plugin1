#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const configDir = path.join(rootDir, 'config');
const workDir = path.join(rootDir, '.pack-temp');

// Clean up any previous work
if (fs.existsSync(workDir)) {
  fs.rmSync(workDir, { recursive: true });
}
fs.mkdirSync(workDir, { recursive: true });

// Copy package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
fs.writeFileSync(
  path.join(workDir, 'package.json'),
  JSON.stringify({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  }, null, 2)
);

// Create static directory with dist contents
const staticDir = path.join(workDir, 'static');
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, staticDir, { recursive: true });
  console.log('✓ Copied dist to static/');
}

// Create default directory with config contents
const defaultDir = path.join(workDir, 'default');
if (fs.existsSync(configDir)) {
  fs.cpSync(configDir, defaultDir, { recursive: true });
  console.log('✓ Copied config to default/');
} else {
  fs.mkdirSync(defaultDir, { recursive: true });
}

// Create tgz file
const outputFile = path.join(rootDir, `${packageJson.name}-${packageJson.version}.tgz`);
try {
  execSync(`cd ${workDir} && tar -czf "${outputFile}" .`, { stdio: 'inherit' });
  console.log(`✓ Created ${path.basename(outputFile)}`);
} catch (error) {
  console.error('Failed to create tar file:', error.message);
  process.exit(1);
}

// Clean up
fs.rmSync(workDir, { recursive: true });
console.log('✓ Cleanup complete');
