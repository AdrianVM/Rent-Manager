const fs = require('fs');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
const paths = require('react-scripts/config/paths');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Filter out source-map-loader rules that would process docx-preview
      webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
        if (rule.enforce === 'pre' && rule.use) {
          const sourceMapLoaderIndex = rule.use.findIndex((loader) =>
            (typeof loader === 'string' && loader.includes('source-map-loader')) ||
            (typeof loader === 'object' && loader.loader && loader.loader.includes('source-map-loader'))
          );

          if (sourceMapLoaderIndex !== -1) {
            return {
              ...rule,
              exclude: [/node_modules\/docx-preview/, ...(rule.exclude ? [rule.exclude] : [])].flat()
            };
          }
        }
        return rule;
      });

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    // Remove deprecated options
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    // Use the new setupMiddlewares option
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Apply before middlewares
      if (fs.existsSync(paths.proxySetup)) {
        require(paths.proxySetup)(devServer.app);
      }
      devServer.app.use(evalSourceMapMiddleware(devServer));

      // Add default middlewares
      middlewares.push({
        name: 'redirect-served-path',
        middleware: redirectServedPath(paths.publicUrlOrPath),
      });

      middlewares.push({
        name: 'noop-service-worker',
        middleware: noopServiceWorkerMiddleware(paths.publicUrlOrPath),
      });

      return middlewares;
    };

    return devServerConfig;
  },
};