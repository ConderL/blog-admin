import { login, logout } from "@/api/login";
import { LoginForm } from "@/api/login/types";
import { getUserInfo } from "@/api/user";
import { removeToken, setToken } from "@/utils/token";
import { defineStore } from "pinia";
import { UserState } from "../interface";

const useUserStore = defineStore("useUserStore", {
  state: (): UserState => ({
    id: null,
    avatar: "",
    roleList: [],
    permissionList: [],
    username: "",
    roles: [],
    permissions: [],
    lockState: false,
  }),
  actions: {
    async LogIn(loginForm: LoginForm) {
      return new Promise((resolve, reject) => {
        console.log("正在发送登录请求...", loginForm);
        login(loginForm)
          .then(({ data }) => {
            console.log("登录响应:", data);

            if (data.flag) {
              // 检查data.data是否包含了完整的用户信息
              if (typeof data.data === "object" && data.data !== null) {
                const userData = data.data;

                // 设置token
                if (userData.token) {
                  setToken(userData.token);
                  console.log("Token已设置");
                }

                // 设置用户信息
                this.id = userData.id;
                this.avatar = userData.avatar || "";
                // this.roleList = userData.roleList || [];
                this.permissionList = userData.permissionList || [];
                this.username = userData.username || "";
                this.roles = [...this.roleList];
                this.permissions = [...this.permissionList];

                console.log("用户信息已设置:", {
                  id: this.id,
                  username: this.username,
                  roles: this.roles.length,
                  permissions: this.permissions.length,
                });
              } else if (
                typeof data.data === "string" &&
                data.data.length > 0
              ) {
                // 兼容旧版本仅返回token的情况
                setToken(data.data);
                console.log("Token已设置(旧版本接口)");
              } else {
                console.error("收到无效数据格式:", data.data);
                reject("无效的登录响应");
                return;
              }
              resolve(data);
            } else {
              console.error("登录失败:", data.msg);
              reject(data.msg);
            }
          })
          .catch((error) => {
            console.error("登录请求出错:", error);
            reject(error);
          });
      });
    },
    GetInfo() {
      return new Promise((resolve, reject) => {
        console.log("正在获取用户信息...");
        getUserInfo()
          .then(({ data }) => {
            console.log("用户信息响应:", data);
            if (data.flag) {
              this.id = data.data.id;
              this.avatar = data.data.avatar;
              this.roleList = data.data.roleList;
              this.permissionList = data.data.permissionList;
              this.username = data.data.username || "";
              this.roles = [...this.roleList];
              this.permissions = [...this.permissionList];
              console.log("用户信息已更新");
              resolve(data.data);
            } else {
              console.error("获取用户信息失败:", data.msg);
              reject(data.msg);
            }
          })
          .catch((error) => {
            console.error("获取用户信息出错:", error);
            reject(error);
          });
      });
    },
    /**
     * 登出
     */
    LogOut() {
      return new Promise<void>((resolve) => {
        logout()
          .then(() => {
            // 移除token
            removeToken();
            // 清空用户信息和权限
            this.id = null;
            this.username = "";
            this.avatar = "";
            this.roleList = [];
            this.permissionList = [];
            this.roles = [];
            this.permissions = [];
            this.lockState = false;
            resolve();
          })
          .catch(() => {
            // 即使API调用失败，也要清除本地状态
            removeToken();
            this.id = null;
            this.username = "";
            this.avatar = "";
            this.roleList = [];
            this.permissionList = [];
            this.roles = [];
            this.permissions = [];
            this.lockState = false;
            resolve();
          });
      });
    },
  },
  getters: {},
});

export default useUserStore;
