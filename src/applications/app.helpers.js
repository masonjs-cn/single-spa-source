/*
 * @Author: Mason
 * @Date: 2023-03-02 22:15:44
 * @LastEditors: Mason
 * @LastEditTime: 2023-03-02 22:25:03
 * @FilePath: /single-spa/src/application/app.helpers.js
 */

// 描述应用的整个状态

export const NOT_LOADED = "NOT_LOADED"; // 没有加载过
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE"; // 加载原代码
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED"; // 没有启动
export const BOOTSTRAPPING = "BOOTSTRAPPING"; // 启动中
export const NOT_MOUNTED = "NOT_MOUNTED"; // 没有挂载
export const MOUNTING = "MOUNTING"; // 挂载中
export const MOUNTED = "MOUNTED"; // 挂载完毕
export const UPDATING = "UPDATING"; // 更新中
export const UNMOUNTING = "UNMOUNTING"; // 卸载中
export const UNLOADING = "UNLOADING"; // 没有加载中
export const LOAD_ERROR = "LOAD_ERROR"; // 加载失败
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN"; // 运行出错

// 当前app是否已经挂载
export function isActive(app) {
  return app.status === MOUNTED;
}

//  当前app是否应该激活
export function shouldBeActive(app) {
  // 如果返回 true ，那么应用应该开始初始化等一系列操作
  return app.activeWhen(window.location);
}
