const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CheckerPlugin = require("awesome-typescript-loader").CheckerPlugin;
const merge = require("webpack-merge");

// JS minification
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

// Compression plugin (for GZIP)
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = env => {
  const isDevBuild = !(env && env.prod);


  // Configuration in common to both client-side and server-side bundles
  const sharedConfig = () => ({

    mode: isDevBuild ? 'development' : 'production',
    stats: { modules: false },
    resolve: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
    output: {
      filename: "[name].js",
      publicPath: "dist/" // Webpack dev middleware, if enabled, handles requests for this URL prefix
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: /ClientApp/,
          loader: "ts-loader"
          //use: "awesome-typescript-loader?silent=true"
        },
        { test: /\.(png|jpg|jpeg|gif|svg)$/, use: "url-loader?limit=25000" }
      ]
    },
    plugins: [new CheckerPlugin()]
  });

  // Configuration for client-side bundle suitable for running in browsers
  const clientBundleOutputDir = "./wwwroot/dist";
  const clientBundleConfig = merge(sharedConfig(), {
    entry: { "main-client": "./ClientApp/boot-client.tsx" },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            use: isDevBuild ? "css-loader" : "css-loader"
          })
        },

        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            use: [
              isDevBuild ? "css-loader" : "css-loader",
              "sass-loader"
            ]
          })
        }
      ]
    },
    output: { path: path.join(__dirname, clientBundleOutputDir) },
    plugins: [
      new ExtractTextPlugin("site.css"),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./wwwroot/dist/vendor-manifest.json")
      })
    ].concat(
      isDevBuild
        ? [
            // Plugins that apply in development builds only
            new webpack.SourceMapDevToolPlugin({
              filename: "[file].map", // Remove this line if you prefer inline source maps
              moduleFilenameTemplate: path.relative(
                clientBundleOutputDir,
                "[resourcePath]"
              ) // Point sourcemap entries to the original file locations on disk
            })
          ]
        : [
            // Plugins that apply in production builds only
            new UglifyJsPlugin(),
            new CompressionPlugin({
              algorithm: 'gzip'
            })
          ]
    )
  });


  return [clientBundleConfig];
};
