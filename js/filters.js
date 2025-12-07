// js/filters.js
// 功能：根据 Seasons / Category / 搜索框 来筛选植物
// 然后更新右侧列表 + 地图上的点

window.PlantFilters = {
  // 目前选中的季节（all / spring / summer / fall / winter）
  currentSeason: 'all',
  // 目前选中的类别（all / native-tree / native-shrub / ...）
  currentCategory: 'all',
  // 搜索框里的内容（空）
  currentSearchTerm: '',

  init() {
    // Chips 容器
    this.seasonGroupEl = document.querySelector('.filter-season');
    this.categoryGroupEl = document.querySelector('.filter-category');

    // 下拉 select 元素（移动端用）
    this.seasonSelectEl = document.getElementById('season-select');
    this.categorySelectEl = document.getElementById('category-select');

    /* ========== 1. 监听季节 chips 点击 ========== */
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

        // 同步下拉菜单的值（如果存在）
        if (this.seasonSelectEl) {
          this.seasonSelectEl.value = this.currentSeason;
        }

        // 每次点完就重新过滤一次
        this.applyFilters();
      });
    }

    /* ========== 2. 监听类别 chips 点击 ========== */
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

        // 同步下拉菜单的值（如果存在）
        if (this.categorySelectEl) {
          this.categorySelectEl.value = this.currentCategory;
        }

        this.applyFilters();
      });
    }

    /* ========== 3. 监听季节下拉菜单变化（移动端） ========== */
    if (this.seasonSelectEl) {
      this.seasonSelectEl.addEventListener('change', (evt) => {
        const value = (evt.target.value || '').toLowerCase() || 'all';
        this.currentSeason = value;

        // 同步 chips 的高亮（桌面端用）
        if (this.seasonGroupEl) {
          const chips = this.seasonGroupEl.querySelectorAll('.filter-chip');
          chips.forEach((chip) => chip.classList.remove('filter-chip-active'));

          const targetChip = this.seasonGroupEl.querySelector(
            `.filter-chip[data-season="${value}"]`
          );
          if (targetChip) {
            targetChip.classList.add('filter-chip-active');
          }
        }

        this.applyFilters();
      });
    }

    /* ========== 4. 监听类别下拉菜单变化（移动端） ========== */
    if (this.categorySelectEl) {
      this.categorySelectEl.addEventListener('change', (evt) => {
        const value = (evt.target.value || '').toLowerCase() || 'all';
        this.currentCategory = value;

        // 同步 chips 的高亮（桌面端用）
        if (this.categoryGroupEl) {
          const chips = this.categoryGroupEl.querySelectorAll('.filter-chip');
          chips.forEach((chip) => chip.classList.remove('filter-chip-active'));

          const targetChip = this.categoryGroupEl.querySelector(
            `.filter-chip[data-category="${value}"]`
          );
          if (targetChip) {
            targetChip.classList.add('filter-chip-active');
          }
        }

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
        // 看这个植物的 group 或 type 文本里有没有 tree，shrub 等字样
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
