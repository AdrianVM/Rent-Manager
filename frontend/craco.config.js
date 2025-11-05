const fs = require('fs');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
const paths = require('react-scripts/config/paths');
const { GenerateSW } = require('workbox-webpack-plugin');

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

      // Add Workbox plugin for PWA support
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugins.push(
          new GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
            exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
              {
                urlPattern: /\/api\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 5 * 60, // 5 minutes
                  },
                },
              },
            ],
          })
        );
      }

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