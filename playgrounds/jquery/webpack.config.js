const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: "development",
  entry: "./index.ts",
  output: {
    filename: "./dist/index.js",
  },
  devtool: "source-map",
  devServer: {
    port: 9000,
    open: true,
    static: '../..',
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    plugins: [new TsconfigPathsPlugin({
      configFile: "./tsconfig.json"
    })]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: "source-map-loader",
        enforce: "pre"
      },      
      { 
        test: /\.tsx?$/, 
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        }
      },
    ]
  }
};