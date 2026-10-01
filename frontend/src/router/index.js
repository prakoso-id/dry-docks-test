import { createRouter, createWebHistory } from "vue-router";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "dry-docks", component: () => import("../views/DryDockListView.vue") },
    { path: "/dry-docks/:id", name: "dry-dock-detail", component: () => import("../views/DryDockDetailView.vue"), props: true },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ],
  scrollBehavior: () => ({ top: 0 })
});
