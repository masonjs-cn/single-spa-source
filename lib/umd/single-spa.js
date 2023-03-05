(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
})(this, (function (exports) { 'use strict';

  /*
   * @Author: Mason
   * @Date: 2023-03-02 22:15:44
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-02 22:25:03
   * @FilePath: /single-spa/src/application/app.helpers.js
   */

  // 描述应用的整个状态

  const NOT_LOADED = "NOT_LOADED"; // 没有加载过
  const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE"; // 加载原代码
  const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED"; // 没有启动
  const BOOTSTRAPPING = "BOOTSTRAPPING"; // 启动中
  const NOT_MOUNTED = "NOT_MOUNTED"; // 没有挂载
  const MOUNTING = "MOUNTING"; // 挂载中
  const MOUNTED = "MOUNTED"; // 挂载完毕
  const UNMOUNTING = "UNMOUNTING"; // 卸载中
  const UNLOADING = "UNLOADING"; // 没有加载中
  const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN"; // 运行出错

  //  当前app是否应该激活
  function shouldBeActive(app) {
    // 如果返回 true ，那么应用应该开始初始化等一系列操作
    return app.activeWhen(window.location);
  }

  /*
   * @Author: Mason
   * @Date: 2023-03-01 23:13:43
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-02 22:34:52
   * @FilePath: /single-spa/src/start.js
   */

  let started = false;
  function start() {
    // 需要挂载应用
    started = true;
    reroute(); // 除了去加载应用还需要去挂载应用
  }

  /*
   * @Author: Mason
   * @Date: 2023-03-02 23:01:10
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-05 13:24:22
   * @FilePath: /single-spa/src/lifecycles/load.js
   */

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
  async function toLoadPromise(app) {
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

  /*
   * @Author: Mason
   * @Date: 2023-03-05 10:08:41
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-05 10:10:06
   * @FilePath: /single-spa/src/lifecycles/unload.js
   */
  const appsToUnload = {};
  async function toUnloadPromise(app) {
    if (!appsToUnload[app.name]) {
      return app;
    }
    app.status = UNLOADING;
    delete app.bootstrap;
    delete app.mount;
    delete app.unmount;
    app.status = NOT_LOADED;
  }

  /*
   * @Author: Mason
   * @Date: 2023-03-02 23:16:46
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-05 10:04:17
   * @FilePath: /single-spa/src/lifecycles/unmount.js
   */

  async function toUnmountPromise(app) {
    // 当前应用没有被挂在直接什么都不做了
    if (app.status != MOUNTED) {
      return app;
    }
    app.status = UNMOUNTING; // 正在卸载中
    await app.unmount(app.customProps);
    app.status = NOT_MOUNTED; // 没有挂载
    return app;
  }

  /*
   * @Author: Mason
   * @Date: 2023-03-02 23:22:29
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-02 23:31:30
   * @FilePath: /single-spa/src/lifecycles/bootstarp.js
   */

  async function toBootstrapPromise(app) {
    if (app.status !== NOT_BOOTSTRAPPED) {
      // 没有启动
      return app;
    }
    app.status = BOOTSTRAPPING; // 启动中
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED; // 没有挂载
    return app;
  }

  /*
   * @Author: Mason
   * @Date: 2023-03-02 23:22:47
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-02 23:31:58
   * @FilePath: /single-spa/src/lifecycles/mount.js
   */
  async function toMountPromise(app) {
    if (app.status !== NOT_MOUNTED) {
      // 挂载完毕
      return app;
    }
    app.status = MOUNTING; //  挂载中
    await app.mount();
    app.status = MOUNTED; // 挂载完毕
    return app;
  }

  // hashchange posttate

  // 用户可能还会绑定自己的路由事件 vue
  // 当我们应用切换后，还需要处理原来的方法,需要再应用切换后在执行

  const routingEventsListeningTo = ["hashchange", "popstate"];

  function urlReroute() {
    reroute(); // 会更新路径重新加载不同的应用
  }

  // 后续挂载的时间先暂存起来
  const capturedEventListeners = {
    hashChange: [],
    popstate: [],
  };

  // hash 方法实现
  // 劫持路由变化，我们处理应用加载的逻辑是在最前面
  window.addEventListener("hashchange", urlReroute);
  window.addEventListener("popstate", urlReroute);

  // 重写addEventListener方法
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (eventName, fn) {
    if (
      routingEventsListeningTo.indexOf(eventName) >= 0 &&
      !capturedEventListeners[eventName].some((listener) => listener == fn)
    ) {
      capturedEevntListeners[eventName].push(fn);
      return;
    }
    return originalAddEventListener.apply(this, arguments);
  };

  window.removeEventListener = function (eventName, listenerFn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
      capturedEventListeners[eventName] = capturedEventListeners[
        eventName
      ].filter((fn) => fn !== listenerFn);
      return;
    }
    return originalRemoveEventListener.apply(this, arguments);
  };

  // 如果是hash路由 hash变化时可以切换
  // 浏览器路由，浏览器路由是h5api的 如果切换时不会触发popstate

  // patched
  function patchedUpdateState(updateState, methodName) {
    return function () {
      const urlBefore = window.location.href;
      const result = updateState.apply(this, arguments);
      const urlAfter = window.location.href;
      if (urlBefore !== urlAfter) {
        urlReroute(new PopStateEvent("popstate", { state }));
      }
      return result;
    };
  }
  // 重写pushState 和 repalceState方法
  window.history.pushState = patchedUpdateState(
    window.history.pushState);
  window.history.replaceState = patchedUpdateState(
    window.history.replaceState);

  /*
   * @Author: Mason
   * @Date: 2023-03-02 22:29:31
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-05 10:27:35
   * @FilePath: /single-spa/src/navigations/reroute.js
   */

  // 核心应用处理方法
  function reroute() {
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
      await appsToLoad.map(toLoadPromise); // 就是获取 bootstrap,mount和 unmount 方法放在 app 上
    }

    //根据路径装载应用
    async function performAppChanges() {
      // 先卸载不需要的应用
      appsToUnmount
        .map(toUnmountPromise)
        .map((unmountPromise) => unmountPromise.then(toUnloadPromise)); // 需要去卸载的 app

      // 去加载需要的应用

      // 这个应用可能需要加载 但是路径不匹配 加载 app1的时候，这个时候，切换到了 app2
      appsToLoad.map(async (app) => {
        // 将需要加载的应用拿到 => 加载 => 启动 => 挂载
        app = await toLoadPromise(app);
        await toBootstrapPromise(app);
        return await toMountPromise(app);
      });

      appsToMount.map(async (app) => {
        app = await toBootstrapPromise(app);
        return toMountPromise(app);
      });
    }
  }

  // 这个流程是用于初始化操作的，我们还需要 当路径切换时重新加载应用
  // 重写路由相关的方法

  /*
   * @Author: Mason
   * @Date: 2023-03-01 23:13:13
   * @LastEditors: Mason
   * @LastEditTime: 2023-03-05 10:26:28
   * @FilePath: /single-spa/src/applications/app.js
   */

  /**
   * @description:注册 app
   * @param {*} appName 应用 名称
   * @param {*} loadApp 加载的应用
   * @param {*} activeWhen 激活时会调用 loadApp
   * @param {*}  customProps 自定义属性
   * @return {*}
   */
  const apps = [];
  function registerApplication(appName, loadApp, activeWhen, customProps) {
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
  function getAppChanges() {
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

  exports.registerApplication = registerApplication;
  exports.start = start;

}));
