import { getUserMenu } from "@/api/menu";
// import ParentView from "@/components/ParentView/index.vue";
// import Layout from "@/layouts/index.vue";
import { constantRoutes } from "@/router";
import { defineStore } from "pinia";
import { RouteComponent, RouteRecordRaw } from "vue-router";
import { PermissionState } from "../interface";

const modules = import.meta.glob("../../views/**/**.vue");
console.log("Available modules:", Object.keys(modules));

export const ParentView = () => import("../../components/ParentView/index.vue");
export const Layout = () => import("../../layouts/index.vue");

function loadView(component: string): RouteComponent {
  console.log("正在加载组件路径:", component);
  // 如果是Layout组件，直接加载
  if (component === "Layout") {
    console.log("返回Layout组件");
    return Layout;
  }
  // 否则尝试使用动态导入加载组件
  try {
    console.log("尝试加载组件:", component);
    const path = `../../views/${component}.vue`;
    console.log("尝试加载路径:", path);
    // 检查路径是否在可用模块中
    const modulePath = Object.keys(modules).find((key) =>
      key.includes(component)
    );
    if (modulePath) {
      console.log("找到匹配的模块:", modulePath);
      return modules[modulePath] as unknown as RouteComponent;
    } else {
      console.warn("未找到组件路径:", path);
      return () => import("../../views/error/404.vue");
    }
  } catch (error) {
    console.error("组件加载失败:", component, error);
    return () => import("../../views/error/404.vue");
  }
}

/**
 * Filter asynchronous routing
 * @param routes asyncRoutes
 */
export function filterAsyncRoutes(routes: RouteRecordRaw[]) {
  const res: RouteRecordRaw[] = [];
  routes.forEach((route) => {
    const tmp = { ...route };
    if (tmp.component) {
      console.log("处理组件:", tmp.path, tmp.component);
      // 判断组件类型
      const componentName = tmp.component as unknown as string;
      if (componentName === "Layout") {
        tmp.component = Layout;
      } else {
        tmp.component = loadView(componentName);
      }
    }
    if (tmp.children) {
      tmp.children = filterAsyncRoutes(tmp.children);
    }
    res.push(tmp);
  });
  return res;
}

const usePermissionStore = defineStore({
  id: "permission",
  state: (): PermissionState => ({
    routes: [],
  }),
  actions: {
    setRoutes(routes: RouteRecordRaw[]) {
      this.routes = constantRoutes.concat(routes);
    },
    generateRoutes(): Promise<RouteRecordRaw[]> {
      return new Promise((resolve, reject) => {
        getUserMenu()
          .then(({ data }) => {
            if (data.flag) {
              const asyncRoutes = data.data;
              const accessedRoutes = filterAsyncRoutes(asyncRoutes);
              console.log("accessedRoutes", accessedRoutes);
              this.setRoutes(accessedRoutes);
              resolve(accessedRoutes);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});

export default usePermissionStore;
