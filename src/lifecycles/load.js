/*
 * @Author: Mason
 * @Date: 2023-03-02 23:01:10
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 13:24:22
 * @FilePath: /single-spa/src/lifecycles/load.js
 */

import {
  NOT_LOADED,
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
} from "../applications/app.helpers";

function flattenFnArray(fns) {
  fns = Array.isArray(fns) ? fns : [fns];
  // 通过 Promise链式来链式调
  return (props) => {
    return fns.reduce((p, fn) => {
      return p.then(() => fn(props));
    }, Promise.resolve());
  };
  // Promise.resolve().then(() => fns(props));
}

// 重复加载
export async function toLoadPromise(app) {
  // console.log("app", app);
  if (app.loadPromise) {
    return app.loadPromise;
  }
  if (app.status !== NOT_LOADED) {
    return app;
  }
  app.status = LOADING_SOURCE_CODE; // 加载原代码
  return (app.loadPromise = Promise.resolve().then(async () => {
    let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);

    app.status = NOT_BOOTSTRAPPED;
    // 我希望将多个 promise 组合在一起 compose
    app.bootstrap = flattenFnArray(bootstrap);
    app.mount = flattenFnArray(mount);
    app.unmount = flattenFnArray(unmount);
    delete app.loadPromise;
    return app;
  }));
}
