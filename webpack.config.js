var path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    //filename: "[name].[contenthash].css",
    filename: '../css/index.css',
    disable: process.env.NODE_ENV === "development"
});

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/js')
  },
  module: {
	rules: [
	{
		test: /\.scss$/,
		use: extractSass.extract({
			use: [{
				loader: "css-loader"
			}, {
				loader: "sass-loader"
			}],
			// use style-loader in development
			fallback: "style-loader"
		}),
	},
	{ 
		test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
		loader: "url-loader", 
		options: { 
			limit: 10000, 
			mimetype: "application/font-woff",
			name: '../fonts/[name].[ext]' 
		} 
	},
    { 
    	test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
    	loader: "file-loader",
    	options: {
    		name: '../fonts/[name].[ext]'
    	}
    }]
  },
  plugins: [
	extractSass
  ]
};
