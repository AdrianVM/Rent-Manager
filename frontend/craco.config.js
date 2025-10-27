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
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      return middlewares;
    },
  },
};