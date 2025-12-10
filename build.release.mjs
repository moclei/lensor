/**
 * Production Release Build Script for Lensor
 * 
 * Usage:
 *   npm run release              # Build without version change
 *   npm run release -- --bump minor   # Bump minor version (1.0.0 → 1.1.0)
 *   npm run release -- --bump major   # Bump major version (1.0.0 → 2.0.0)
 *   npm run release -- --bump patch   # Bump patch version (1.0.0 → 1.0.1)
 *   npm run release -- --version 1.2.0  # Set explicit version
 * 
 * This script:
 *   - Removes sourcemaps (keeps source private)
 *   - Strips console.* and debugger statements
 *   - Cleans dist/ before building
 *   - Does NOT auto-increment version (unlike build.mjs)
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const distDir = './dist';
const manifestPath = './manifest.json';

// Parse command line args
const args = process.argv.slice(2);

function parseArgs() {
  const result = { bump: null, version: null };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bump' && args[i + 1]) {
      result.bump = args[i + 1];
      i++;
    } else if (args[i] === '--version' && args[i + 1]) {
      result.version = args[i + 1];
      i++;
    }
  }
  
  return result;
}

function bumpVersion(currentVersion, bumpType) {
  let [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${minor === undefined ? 0 : major}.${(minor || 0) + 1}.0`;
    case 'patch':
      return `${major}.${minor || 0}.${(patch || 0) + 1}`;
    default:
      throw new Error(`Unknown bump type: ${bumpType}. Use 'major', 'minor', or 'patch'.`);
  }
}

function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
    console.log('🧹 Cleaned dist/ directory');
  }
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function build() {
  const { bump, version } = parseArgs();
  
  // Handle versioning
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const originalVersion = manifest.version;
  
  if (version) {
    // Explicit version set
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.2.0)');
      process.exit(1);
    }
    manifest.version = version;
    console.log(`📦 Setting version: ${version}`);
  } else if (bump) {
    // Bump version
    manifest.version = bumpVersion(originalVersion, bump);
    console.log(`📦 Bumping ${bump} version: ${originalVersion} → ${manifest.version}`);
  } else {
    console.log(`📦 Building version: ${manifest.version} (no version change)`);
  }
  
  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Clean and prepare dist
  cleanDist();
  ensureDirExists(distDir);
  
  // Common esbuild options for production
  const commonOptions = {
    bundle: true,
    minify: true,
    sourcemap: false,  // No sourcemaps for release
    drop: ['console', 'debugger'],  // Strip console.* and debugger
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    logLevel: 'warning',
  };
  
  console.log('🔨 Building...');
  
  try {
    // Build service worker and content script
    await esbuild.build({
      ...commonOptions,
      entryPoints: [
        './src/scripts/content-script.ts',
        './src/service-workers/service-worker.ts',
      ],
      outdir: distDir,
      format: 'esm',
    });
    
    // Build sidepanel
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['./src/sidepanel/index.tsx'],
      outfile: 'dist/sidepanel/index.js',
      target: ['chrome91'],  // Modern Chrome only
      loader: { '.ts': 'ts', '.tsx': 'tsx' },
    });
    
    // Build UI
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['./src/ui/index.tsx'],
      outfile: 'dist/ui/index.js',
      target: ['chrome91'],  // Modern Chrome only
      loader: { '.ts': 'ts', '.tsx': 'tsx' },
    });
    
    // Copy assets
    const assets = ['./src/assets'];
    assets.forEach(assetDir => {
      fs.readdirSync(assetDir).forEach(file => {
        const srcPath = path.join(assetDir, file);
        const destPath = path.join(distDir, file);
        copyRecursiveSync(srcPath, destPath);
      });
    });
    
    // Copy HTML and CSS from root src to dist
    fs.readdirSync(srcDir).forEach(file => {
      if (file.endsWith('.html') || file.endsWith('.css')) {
        fs.copyFileSync(`${srcDir}/${file}`, `${distDir}/${file}`);
      }
    });
    
    // Copy sidepanel HTML
    ensureDirExists(path.join(distDir, 'sidepanel'));
    const sidepanelDir = './src/sidepanel';
    fs.readdirSync(sidepanelDir).forEach(file => {
      if (file.endsWith('.html')) {
        fs.copyFileSync(`${srcDir}/sidepanel/${file}`, `${distDir}/sidepanel/${file}`);
      }
    });
    
    // Copy manifest
    fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));
    
    // Calculate bundle sizes
    const files = [
      'dist/ui/index.js',
      'dist/sidepanel/index.js',
      'dist/service-workers/service-worker.js',
      'dist/scripts/content-script.js',
    ];
    
    console.log('\n✅ Release build complete!\n');
    console.log('📊 Bundle sizes:');
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`   ${file}: ${sizeKB} KB`);
      }
    });
    
    console.log(`\n🏷️  Version: ${manifest.version}`);
    console.log('📁 Output: dist/');
    console.log('\n💡 Next steps:');
    console.log('   1. Test the extension by loading dist/ in chrome://extensions');
    console.log('   2. Create a ZIP of the dist/ contents for upload');
    console.log('   3. Upload to Chrome Web Store Developer Dashboard\n');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

