<template>
  <div v-if="!item.meta || !item.meta.hidden">
    <template
      v-if="
        hasOneShowingChild(item.children, item) &&
        onlyOneChild &&
        (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
        !item.alwaysShow
      "
    >
      <app-link
        v-if="onlyOneChild && onlyOneChild.meta"
        :to="resolvePath(onlyOneChild.path || '')"
      >
        <el-menu-item
          :index="resolvePath(onlyOneChild.path || '')"
          :class="{ 'submenu-title-noDropdown': !isNest }"
        >
          <el-icon v-if="onlyOneChild.meta && onlyOneChild.meta.icon">
            <svg-icon :icon-class="onlyOneChild.meta.icon" />
          </el-icon>
          <template #title>
            <span>{{ onlyOneChild.meta.title || "未命名菜单" }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path || '')">
      <template #title>
        <el-icon v-if="item.meta && item.meta.icon">
          <svg-icon :icon-class="item.meta.icon" />
        </el-icon>
        <span v-if="item.meta && item.meta.title">{{ item.meta.title }}</span>
        <span v-else>未命名菜单</span>
      </template>

      <sidebar-item
        v-for="child in item.children || []"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path || '')"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouteRecordRaw } from "vue-router";
import path from "path-browserify";
import SvgIcon from "@/components/SvgIcon/index.vue";
import AppLink from "./Link.vue";

interface MenuItem {
  path?: string;
  name?: string;
  alwaysShow?: boolean;
  meta?: {
    title?: string;
    icon?: string;
    hidden?: boolean;
  };
  children?: MenuItem[];
  noShowingChildren?: boolean;
}

const props = defineProps({
  // route object
  item: {
    type: Object as () => MenuItem,
    required: true,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: "",
  },
});

const onlyOneChild = ref<MenuItem | null>(null);
const subMenu = ref(null);

onMounted(() => {
  // 确保组件加载后重新计算菜单
  if (subMenu.value) {
    console.log("子菜单已加载:", props.item.path);
  }
});

function hasOneShowingChild(children: MenuItem[] = [], parent: MenuItem) {
  if (!children) {
    children = [];
  }

  const showingChildren = children.filter((item) => {
    if (item?.meta?.hidden) {
      return false;
    } else {
      // 临时设置
      onlyOneChild.value = item;
      return true;
    }
  });

  // 当只有一个子路由，默认显示子路由
  if (showingChildren.length === 1) {
    return true;
  }

  // 没有子路由则显示父路由
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: "", noShowingChildren: true };
    return true;
  }

  return false;
}

function resolvePath(routePath: string) {
  if (!routePath) {
    return props.basePath;
  }

  if (routePath.startsWith("/")) {
    return routePath;
  }

  try {
    // 使用path.resolve来正确构建路径
    const resolvedPath = path.resolve(props.basePath, routePath);
    console.log(
      "解析路径:",
      routePath,
      "基础路径:",
      props.basePath,
      "结果:",
      resolvedPath
    );
    return resolvedPath;
  } catch (error) {
    console.error("路径解析错误:", error);
    // 回退到简单连接
    return props.basePath + "/" + routePath;
  }
}
</script>

<style lang="scss" scoped>
.el-menu-item,
.el-sub-menu {
  .el-icon {
    margin-right: 8px;
  }
}

.menu-title {
  display: inline-block;
  margin-left: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
