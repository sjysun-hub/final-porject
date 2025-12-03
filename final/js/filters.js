// js/filters.js
// 功能：根据 Seasons / Category / 搜索框 来筛选植物
// 然后更新右侧列表 + 地图上的点

window.PlantFilters = {
  // 目前选中的季节（All / Spring / Summer / Fall / Winter）
  currentSeason: 'all',
  // 目前选中的类别（All / Trees / Shrubs / ...）
  currentCategory: 'all',
  // 搜索框里的内容（空）
  currentSearchTerm: '',

  init() {
    // 找到季节那一行的容器
    this.seasonGroupEl = document.querySelector('.filter-season');
    // 找到类别那一行的容器
    this.categoryGroupEl = document.querySelector('.filter-category');

    // 监听季节 chips 点击
    if (this.seasonGroupEl) {
      this.seasonGroupEl.addEventListener('click', (evt) => {
        const btn = evt.target.closest('.filter-chip');
        if (!btn) return;

        // 把这一组里的 active 去掉，只给当前按钮加上
        const chips = this.seasonGroupEl.querySelectorAll('.filter-chip');
        chips.forEach((chip) => chip.classList.remove('filter-chip-active'));
        btn.classList.add('filter-chip-active');

        // 读出 data-season 的值（all / spring / summer / ...）
        const value = (btn.dataset.season || '').toLowerCase();
        this.currentSeason = value || 'all';

        // 每次点完就重新过滤一次
        this.applyFilters();
      });
    }

    // 监听类别 chips 点击
    if (this.categoryGroupEl) {
      this.categoryGroupEl.addEventListener('click', (evt) => {
        const btn = evt.target.closest('.filter-chip');
        if (!btn) return;

        const chips = this.categoryGroupEl.querySelectorAll('.filter-chip');
        chips.forEach((chip) => chip.classList.remove('filter-chip-active'));
        btn.classList.add('filter-chip-active');

        // 读 data-category（all / native-tree / native-shrub ...）
        const value = (btn.dataset.category || '').toLowerCase();
        this.currentCategory = value || 'all';

        this.applyFilters();
      });
    }

    console.log('PlantFilters.init done');
  },

  // 给 search.js 用：更新搜索词
  setSearchTerm(term) {
    this.currentSearchTerm = (term || '').trim().toLowerCase();
    this.applyFilters();
  },

  // 过滤逻辑
  applyFilters() {
    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantFilters: PlantsData not available');
      return;
    }

    const seasonKey = this.currentSeason;
    const catKey = this.currentCategory;
    const searchTerm = this.currentSearchTerm;

    const filtered = window.PlantsData.filter((plant) => {
      // ---------- 1. 按季节过滤 ----------
      if (seasonKey !== 'all') {
        let okSeason = true;
        // 数据里预期：seasons: ['spring', 'summer', ...]
        if (Array.isArray(plant.seasons) && plant.seasons.length > 0) {
          okSeason = plant.seasons.includes(seasonKey);
        }
        if (!okSeason) return false;
      }

      // ---------- 2. 按类别过滤 ----------
      if (catKey !== 'all') {
        // 看这个植物的 group ， type 文本里有没有 tree，shrub 等字样
        const groupText = (
          plant.group ||
          plant.type ||
          ''
        ).toLowerCase();

        let isMatchCategory = false;

        if (catKey.includes('tree')) {
          isMatchCategory = groupText.includes('tree');
        } else if (catKey.includes('shrub')) {
          isMatchCategory = groupText.includes('shrub');
        } else if (catKey.includes('vine')) {
          isMatchCategory = groupText.includes('vine');
        } else if (catKey.includes('perennial')) {
          isMatchCategory = groupText.includes('perennial');
        } else if (catKey.includes('fern')) {
          isMatchCategory = groupText.includes('fern');
        } else if (catKey.includes('grass')) {
          isMatchCategory = groupText.includes('grass');
        }

        if (!isMatchCategory) return false;
      }

      // ---------- 3. 按搜索词过滤 ----------
      if (searchTerm) {
        const text = [
          plant.nameEn || '',
          plant.nameZh || '',
          plant.scientificName || '',
          plant.type || '',
          plant.habit || '',
          plant.habitat || '',
          plant.description || ''
        ]
          .join(' ')
          .toLowerCase();

        if (!text.includes(searchTerm)) return false;
      }

      // 三个条件都通过，就保留这个 plant
      return true;
    });

    // ---------- 更新右侧列表 ----------
    if (window.PlantList && typeof window.PlantList.renderList === 'function') {
      window.PlantList.renderList(filtered);
    }

    // ---------- 更新地图上的点 ----------
    if (window.PlantMap && typeof window.PlantMap.setVisibleIds === 'function') {
      const ids = filtered
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => p.id);

      window.PlantMap.setVisibleIds(ids);
    }
  }
};
