/*
 * @Author: Mason
 * @Date: 2023-03-02 23:16:46
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 10:04:17
 * @FilePath: /single-spa/src/lifecycles/unmount.js
 */
import { UNMOUNTING, NOT_MOUNTED, MOUNTED } from "../applications/app.helpers";

export async function toUnmountPromise(app) {
  // 当前应用没有被挂在直接什么都不做了
  if (app.status != MOUNTED) {
    return app;
  }
  app.status = UNMOUNTING; // 正在卸载中
  await app.unmount(app.customProps);
  app.status = NOT_MOUNTED; // 没有挂载
  return app;
}
