/*
 * @Author: Mason
 * @Date: 2023-03-01 23:13:43
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-02 22:34:52
 * @FilePath: /single-spa/src/start.js
 */
import { reroute } from "./navigations/reroute";

export let started = false;
export function start() {
  // 需要挂载应用
  started = true;
  reroute(); // 除了去加载应用还需要去挂载应用
}
