/*
 * @Author: Mason
 * @Date: 2023-03-01 22:57:14
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-01 22:59:52
 * @FilePath: /single-spa/rollup.config.js
 */
import serve from "rollup-plugin-serve";

// rollup 可以帮忙打包 es6 的模块化语法
export default {
  input: "./src/single-spa.js",
  output: {
    file: "./lib/umd/single-spa.js",
    format: "umd", // 会挂载到 window 上
    name: "singleSpa",
    souremap: true,
  },
  plugins: [
    serve({
      openPage: "/index.html",
      contentBase: "",
      port: 3000,
    }),
  ],
};
