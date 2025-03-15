import esbuild from 'esbuild';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const srcDir = './src';
const distDir = './dist';
const manifestPath = './manifest.json';

const entryPoints = [
  './src/scripts/content-script.ts',
  './src/service-workers/service-worker.ts'
];
const assets = ['./src/assets'];
const sidepanelDir = './src/sidepanel';
const uiDir = './src/ui';

// Path alias plugin
const aliasPlugin = {
  name: 'alias-plugin',
  setup(build) {
    // Handle path aliases based on tsconfig.json paths
    build.onResolve({ filter: /^@\// }, (args) => {
      return { path: path.resolve(srcDir, args.path.replace('@/', '')) };
    });

    build.onResolve({ filter: /^@ui\// }, (args) => {
      return {
        path: path.resolve(srcDir, 'ui', args.path.replace('@ui/', ''))
      };
    });

    build.onResolve({ filter: /^@features\// }, (args) => {
      return {
        path: path.resolve(
          srcDir,
          'ui/features',
          args.path.replace('@features/', '')
        )
      };
    });

    build.onResolve({ filter: /^@hook\// }, (args) => {
      return {
        path: path.resolve(srcDir, 'ui/hook', args.path.replace('@hook/', ''))
      };
    });

    build.onResolve({ filter: /^@sidepanel\// }, (args) => {
      return {
        path: path.resolve(
          srcDir,
          'sidepanel',
          args.path.replace('@sidepanel/', '')
        )
      };
    });
  }
};

const isDev = process.argv.includes('--dev');
const isWatch = process.argv.includes('--watch');

const build = () => {
  ensureDirExists(distDir);

  // Only increment version when not in development mode
  if (!isDev) {
    // Increment the patch version in manifest.json
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    let [major, minor, patch] = manifest.version.split('.').map(Number);
    patch += 1;
    manifest.version = `${major}.${minor}.${patch}`;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Common build options
  const commonOptions = {
    bundle: true,
    minify: !isDev,
    sourcemap: true,
    target: ['chrome90'], // Updated for more modern Chrome/MV3
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.png': 'file',
      '.jpg': 'file',
      '.svg': 'file',
      '.gif': 'file'
    },
    define: {
      'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
    },
    plugins: [aliasPlugin],
    logLevel: 'info'
  };

  // Build content and service worker scripts
  esbuild
    .build({
      ...commonOptions,
      entryPoints: entryPoints,
      outdir: distDir,
      format: 'esm'
    })
    .catch(() => process.exit(1));

  // Build sidepanel
  esbuild
    .build({
      ...commonOptions,
      entryPoints: ['./src/sidepanel/index.tsx'],
      outfile: 'dist/sidepanel/index.js'
    })
    .catch(() => process.exit(1));

  // Build UI
  esbuild
    .build({
      ...commonOptions,
      entryPoints: ['./src/ui/index.tsx'],
      outfile: 'dist/ui/index.js'
    })
    .catch(() => process.exit(1));

  // Copy assets
  assets.forEach((assetDir) => {
    if (fs.existsSync(assetDir)) {
      fs.readdirSync(assetDir).forEach((file) => {
        const srcPath = path.join(assetDir, file);
        const destPath = path.join(distDir, file);
        copyRecursiveSync(srcPath, destPath);
      });
    }
  });

  // Copy HTML and CSS from root src to dist
  fs.readdirSync(srcDir).forEach((file) => {
    if (file.endsWith('.html') || file.endsWith('.css')) {
      fs.copyFileSync(`${srcDir}/${file}`, `${distDir}/${file}`);
    }
  });

  // Copy sidepanel assets
  ensureDirExists(path.join(distDir, 'sidepanel'));
  fs.readdirSync(sidepanelDir).forEach((file) => {
    if (file.endsWith('.html')) {
      fs.copyFileSync(
        `${srcDir}/sidepanel/${file}`,
        `${distDir}/sidepanel/${file}`
      );
    }
  });

  // Ensure UI directory exists and copy UI assets if needed
  ensureDirExists(path.join(distDir, 'ui'));
  if (fs.existsSync(uiDir)) {
    fs.readdirSync(uiDir).forEach((file) => {
      if (file.endsWith('.html') || file.endsWith('.css')) {
        fs.copyFileSync(`${srcDir}/ui/${file}`, `${distDir}/ui/${file}`);
      }
    });
  }

  // Only trigger Keyboard Maestro in production builds
  if (!isDev) {
    // triggerKeyboardMaestroMacro();
  }

  copyManifest();

  console.log(
    `Build completed in ${isDev ? 'development' : 'production'} mode.`
  );
};

// Initial build
build();

// Watch for file changes in src directory if --watch flag is used
if (isWatch) {
  console.log('Watching for changes...');
  chokidar.watch(srcDir).on('change', (filePath) => {
    console.log(`Rebuilding => File ${filePath} has been changed`);
    build();
  });
}

// Function to ensure directory exists
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
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyManifest() {
  const destManifestPath = path.join(distDir, 'manifest.json');
  fs.copyFileSync(manifestPath, destManifestPath);
}

function triggerKeyboardMaestroMacro() {
  const script = `
      tell application "Keyboard Maestro Engine"
          do script "52E810AA-4A52-4E4F-8244-D75FD150D49B"
      end tell
  `;
  exec(`osascript -e '${script}'`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
    console.log(stdout);
  });
}
