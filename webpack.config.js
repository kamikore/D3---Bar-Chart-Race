const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')


const config = {
    mode: 'development',
    entry: path.join(__dirname,'src','index.js'),
    output:{
        filename: 'bundle.js',
        path: path.join(__dirname,'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ]
}

module.exports = config;