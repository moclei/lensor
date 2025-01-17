import esbuild from 'esbuild';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import {exec} from 'child_process';
const srcDir = './src';
const distDir = './dist';
const manifestPath = './manifest.json';

const entryPoints = [
    './src/scripts/content-script.ts',
    './src/service-workers/service-worker.ts',
];
const assets = ['./src/assets'];
const sidepanelDir = './src/sidepanel';

const build = () => {
    ensureDirExists(distDir);
    // Increment the minor version in manifest.json
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    let [major, minor, patch] = manifest.version.split('.').map(Number);
    patch += 1;
    manifest.version = `${major}.${minor}.${patch}`;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    esbuild.build({
        entryPoints: entryPoints,
        outdir: distDir,
        bundle: true,
        minify: true,
        sourcemap: true,
        format: 'esm'
    }).catch(() => process.exit(1));

    esbuild.build({
        entryPoints: ['./src/sidepanel/index.tsx'],
        outfile: 'dist/sidepanel/index.js',
        bundle: true,
        minify: true,
        sourcemap: true,
        target: ['chrome58', 'firefox57'],
        loader: { '.ts': 'ts', '.tsx': 'tsx' },
        define: {
          'process.env.NODE_ENV': '"production"'
        },
    }).catch(() => process.exit(1));

    esbuild.build({
        entryPoints: ['./src/ui/index.tsx'],
        outfile: 'dist/ui/index.js',
        bundle: true,
        minify: true,
        sourcemap: true,
        target: ['chrome58', 'firefox57'],
        loader: { '.ts': 'ts', '.tsx': 'tsx' },
        define: {
          'process.env.NODE_ENV': '"production"'
        },
    }).catch(() => process.exit(1));

    // Copy assets
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


     // Copy assets

        fs.readdirSync(sidepanelDir).forEach(file => {
            if (file.endsWith('.html') ) {
                fs.copyFileSync(`${srcDir}/sidepanel/${file}`, `${distDir}/sidepanel/${file}`);
            }
        });

    //triggerKeyboardMaestroMacro();
    copyManifest();
};

// Initial build
build();

// Watch for file changes in src directory
chokidar.watch(srcDir).on('change', (event, path) => {
    console.log(`Rebuilding => File ${event} has been changed`);
    build();
});


// Function to ensure directory exists
function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName),
                              path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

function copyManifest() {
    const destManifestPath = path.join(distDir, 'manifest.json');
    fs.copyFileSync(manifestPath, destManifestPath);
};


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

