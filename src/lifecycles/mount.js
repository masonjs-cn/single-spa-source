/*
 * @Author: Mason
 * @Date: 2023-03-02 23:22:47
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-02 23:31:58
 * @FilePath: /single-spa/src/lifecycles/mount.js
 */
import { MOUNTED, MOUNTING, NOT_MOUNTED } from "../applications/app.helpers.js";
export async function toMountPromise(app) {
  if (app.status !== NOT_MOUNTED) {
    // 挂载完毕
    return app;
  }
  app.status = MOUNTING; //  挂载中
  await app.mount();
  app.status = MOUNTED; // 挂载完毕
  return app;
}
