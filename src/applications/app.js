/*
 * @Author: Mason
 * @Date: 2023-03-01 23:13:13
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 15:48:01
 * @FilePath: /single-spa/src/applications/app.js
 */

import {
  LOADING_SOURCE_CODE,
  NOT_LOADED,
  shouldBeActive,
  SKIP_BECAUSE_BROKEN,
} from "./app.helpers";
import { reroute } from "../navigations/reroute";
import { NOT_BOOTSTRAPPED } from "./app.helpers";
import { NOT_MOUNTED } from "./app.helpers";
import { MOUNTED } from "./app.helpers";

const apps = []; // 注册的服务

/**
 * @description:注册 app
 * @param {*} appName 应用 名称
 * @param {*} loadApp 加载的应用
 * @param {*} activeWhen 激活时会调用 loadApp
 * @param {*}  customProps 自定义属性
 * @return {*}
 */
export function registerApplication(appName, loadApp, activeWhen, customProps) {
  apps.push({
    // 这里讲应用注册好了
    name: appName,
    loadApp,
    activeWhen, // 当前状态
    customProps,
    status: NOT_LOADED,
  });

  reroute(); // 加载应用

  // 生命周期
}

// 获取 app 改变状态
export function getAppChanges() {
  const appsToUnmount = []; // app 去卸载
  const appsToLoad = []; // app 去加载
  const appsToMount = []; // app 去挂载
  apps.forEach((app) => {
    const appShouldBeActive =
      app.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);
    switch (
      app.status // toLoad
    ) {
      case NOT_LOADED: // 没有加载过
      case LOADING_SOURCE_CODE: // 加载原代码
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_BOOTSTRAPPED: /// 没有启动
      case NOT_MOUNTED: // 没有挂载
        if (appShouldBeActive) {
          appsToMount.push(app);
        }
        break;
      case MOUNTED: // 挂载完毕 // toUnmount
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
    }
  });
  return { appsToUnmount, appsToLoad, appsToMount };
}
