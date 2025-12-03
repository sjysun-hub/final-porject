// js/search.js
// 功能：
// 1. 监听顶部搜索框的输入
// 2. 把搜索词交给 PlantFilters 去做过滤

window.PlantSearch = {
  init() {
    const input = document.getElementById('plant-search');
    if (!input) {
      console.warn('PlantSearch: #plant-search not found');
      return;
    }

    // 一个小工具函数：安全地调用 PlantFilters.setSearchTerm
    const applySearch = (value) => {
      if (
        !window.PlantFilters ||
        typeof window.PlantFilters.setSearchTerm !== 'function'
      ) {
        return;
      }
      window.PlantFilters.setSearchTerm(value);
    };

    // 每次输入变化，就更新一次搜索词
    input.addEventListener('input', () => {
      applySearch(input.value);
    });

    // 如果浏览器自动填充了内容也同步一次
    if (input.value) {
      applySearch(input.value);
    }

    console.log('PlantSearch.init done');
  }
};
