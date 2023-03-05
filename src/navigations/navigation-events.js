/*
 * @Author: Mason
 * @Date: 2023-03-05 09:25:00
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-05 16:26:46
 * @FilePath: /single-spa/src/navigations/navigation-events.js
 */
import { reroute } from "./reroute";

// 用户可能还会绑定自己的路由事件 vue
// 当我们应用切换后，还需要处理原来的方法,需要再应用切换后在执行

export const routingEventsListeningTo = ["hashchange", "popstate"];

function urlReroute() {
  reroute([], arguments); // 会更新路径重新加载不同的应用
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
  window.history.pushState,
  "pushState"
);
window.history.replaceState = patchedUpdateState(
  window.history.replaceState,
  "replaceState"
);

// 在子应用加载完毕后调用此方法，执行拦截的逻辑（保证子应用加载完后执行）
export function callCapturedEventListeners(eventArguments) {
  if (eventArguments) {
    const eventType = eventArguments[0].type;
    if (routingEventsListeningTo.indexOf(eventType) >= 0) {
      capturedEventListeners[eventType].forEach((listener) => {
        listener.apply(this, eventArguments);
      });
    }
  }
}
