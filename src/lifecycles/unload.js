/*
 * @Author: Mason
 * @Date: 2023-03-05 10:08:41
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 10:10:06
 * @FilePath: /single-spa/src/lifecycles/unload.js
 */
import { NOT_LOADED, UNLOADING } from "../applications/app.helpers";
const appsToUnload = {};
export async function toUnloadPromise(app) {
  if (!appsToUnload[app.name]) {
    return app;
  }
  app.status = UNLOADING;
  delete app.bootstrap;
  delete app.mount;
  delete app.unmount;
  app.status = NOT_LOADED;
}
