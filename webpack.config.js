const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const modoDev = process.env.NODE_ENV !== 'production'

module.exports = {
    mode: modoDev ? 'development' : 'production',
    entry: './src/js/principal.js',
    output: {
        filename: 'main.js',
        path: __dirname + '/public'
    },

    devServer: {
        static: './public',
        port: 9000
    },

    optimization: {
        // '...' mantém o minificador de JS padrão (terser) do Webpack 5
        minimizer: [
            '...',
            new CssMinimizerPlugin()
        ]
    },

    plugins: [
        new MiniCSSExtractPlugin({
            filename: 'estilo.css'
        }),
        new Dotenv(),
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/assets/images', to: 'images' }
            ]
        })
    ],
    module: {
        rules: [
            {
                test: /\.s?[ac]ss$/,
                use: [
                    MiniCSSExtractPlugin.loader,
                    //'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(ico|svg|jpg|png|gif|PNG)$/,
                type: 'asset/resource'
            }
        ]
    }
}
