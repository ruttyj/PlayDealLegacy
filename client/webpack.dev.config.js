var HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = (env) => {
  return {
    mode: "production",
    entry: "./src/index.jsx",
    resolve: {
      extensions: [".js", ".jsx"],
    },
    devServer: {
      hot: false,
      inline: false,
      liveReload: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.jsx?$/,
          use: "babel-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: "./src/index.html", inject: false }),
      new webpack.DefinePlugin({
        "process.env.CONNECT": `"http://localhost:3001"`,
      }),
    ],
  };
};
