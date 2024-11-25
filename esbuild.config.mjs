import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';

// Determine if we're in production mode
const isProd = process.argv.includes('--production');

// Banner to include at the top of the generated file
const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the GitHub repository of this plugin.
*/
`;

// Define external dependencies that should not be bundled
const externalDependencies = [
  'obsidian',
  'electron',
  '@codemirror/*',
  '@lezer/*',
  ...builtins,
];

// Build options common to both development and production
const buildOptions = {
  entryPoints: ['./src/main.ts'],
  bundle: true,
  platform: '',
  target: 'es2017',
  external: externalDependencies,
  format: 'cjs',
  outfile: 'main.js',
  sourcemap: isProd ? false : 'inline',
  minify: isProd,
  banner: { js: banner },
  logLevel: 'info',
};

async function build() {
  if (!isProd) {
    // Development build with watch mode
    const context = await esbuild.context(buildOptions);

    // Start watching for file changes
    await context.watch();

    console.log('Watching for changes...');
  } else {
    // Production build (one-time build)
    await esbuild.build(buildOptions);
  }
}

// Execute the build function
build().catch((error) => {
  console.error(error);
  process.exit(1);
});