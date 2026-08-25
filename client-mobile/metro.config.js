// This app lives inside the nagar_seva_app npm workspace monorepo, so Metro needs to know
// about the repo root: dependencies are hoisted to the root node_modules, not this folder's.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// The web client at the workspace root pulls in its own React 18 install, which was still
// getting picked up for some "react"/"react-dom" requires alongside this app's React 19 install,
// loading two React copies at once ("Invalid hook call"). extraNodeModules alone did NOT fix this
// (it's only a fallback Metro consults when normal resolution fails to find the module elsewhere
// — and "react" always resolves fine via the root node_modules, so the fallback never triggered).
// resolveRequest intercepts unconditionally, before any hierarchical lookup happens, so it's the
// only way to force a single instance.
const forcedModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Also catches subpath imports like "react/jsx-runtime" or "react-native/Libraries/...".
  const forcedRoot = Object.keys(forcedModules).find(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`)
  );
  if (forcedRoot) {
    const subpath = moduleName.slice(forcedRoot.length);
    return {
      filePath: require.resolve(forcedModules[forcedRoot] + subpath),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
