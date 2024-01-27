/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

module.exports = {
  devServer: {
    port: 4999,
    hot: false,
    open: false
  },
  devtool: "source-map",
  entry: "./frontend/index.tsx",
  module: {
    rules: [
      {
        loader: "raw-loader",
        test: /\.(txt|html|md)$/u
      },
      {
        loader: "ts-loader",
        test: /\.tsx?$/u
      },
      {
        include: /\.module\.css$/u,
        test: /\.css$/u,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: true
            }
          }
        ]
      },
      {
        exclude: /\.module\.css$/u,
        test: /\.css$/u,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.less$/u,
        use: [
          "style-loader",
          "css-loader",
          "less-loader"
        ]
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg|png|jpg|gif|mp4|webm)$/u,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "hashed/[name]-[contenthash].[ext]"
            }
          }
        ]
      }
    ]
  },
  output: {
    chunkFilename: "hashed/[name]-[chunkhash].js",
    filename: "hashed/[name]-[fullhash].js",
    path: path.join(
      __dirname,
      "public"
    ),
    publicPath: "/"
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./frontend/index.htm"
    })
  ],
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      'react/jsx-runtime': 'react/jsx-runtime.js',
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
    },
    extensions: [
      ".ts",
      ".tsx",
      ".js",
      ".css"
    ]
  }
};
