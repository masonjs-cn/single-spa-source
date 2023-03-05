/*
 * @Author: Mason
 * @Date: 2023-03-02 22:29:31
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 16:23:19
 * @FilePath: /single-spa/src/navigations/reroute.js
 */
import { getAppChanges } from "../applications/app";
import { started } from "../start";
import { toLoadPromise } from "../lifecycles/load";
import { toUnloadPromise } from "../lifecycles/unload";
import { toUnmountPromise } from "../lifecycles/unmount";
import { toBootstrapPromise } from "../lifecycles/bootstarp";
import { toMountPromise } from "../lifecycles/mount";
import "./navigation-events";

// 核心应用处理方法
export function reroute() {
  const {
    appsToLoad, // 获取要去加载的app
    appsToMount, // 获取要被挂载的
    appsToUnmount, // 获取要被卸载的
  } = getAppChanges();

  // start方法调用时候是同步，但是加载流程是异步的
  if (started) {
    // app 装载
    console.log("调用 start 方法");
    return performAppChanges(); // 通过路径来装载应用
  } else {
    // 注册应用时 需要预先加载
    // console.log("调用 registerApplication");
    return loadApps();
  }

  //预加载应用
  async function loadApps() {
    let apps = await appsToLoad.map(toLoadPromise); // 就是获取 bootstrap,mount和 unmount 方法放在 app 上
  }

  //根据路径装载应用
  async function performAppChanges() {
    // 先卸载不需要的应用
    let unmountPromises = appsToUnmount
      .map(toUnmountPromise)
      .map((unmountPromise) => unmountPromise.then(toUnloadPromise)); // 需要去卸载的 app

    // 去加载需要的应用
    // 这个应用可能需要加载 但是路径不匹配 加载 app1的时候，这个时候，切换到了 app2
    // 将需要加载的应用拿到 => 加载 => 启动 => 挂载
    const loadThenMountPromises = appsToLoad.map(async (app) => {
      app = await toLoadPromise(app);
      app = await toBootstrapPromise(app);
      return toMountPromise(app);
    });

    const mountPromises = appsToMount.map(async (app) => {
      app = await toBootstrapPromise(app);
      return toMountPromise(app);
    });

    await Promise.all(unmountPromises); // 等待先卸载完成
    await Promise.all([...loadThenMountPromises, ...mountPromises]);
  }
}

// 这个流程是用于初始化操作的，我们还需要 当路径切换时重新加载应用
// 重写路由相关的方法
