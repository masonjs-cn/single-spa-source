/*
 * @Author: Mason
 * @Date: 2023-03-02 23:22:29
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-02 23:31:30
 * @FilePath: /single-spa/src/lifecycles/bootstarp.js
 */
import {
  BOOTSTRAPPING,
  NOT_MOUNTED,
  NOT_BOOTSTRAPPED,
} from "../applications/app.helpers";

export async function toBootstrapPromise(app) {
  if (app.status !== NOT_BOOTSTRAPPED) {
    // 没有启动
    return app;
  }
  app.status = BOOTSTRAPPING; // 启动中
  await app.bootstrap(app.customProps);
  app.status = NOT_MOUNTED; // 没有挂载
  return app;
}
