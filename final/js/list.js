// js/list.js
// 功能：
// 1. 根据 window.PlantsData 生成右侧植物列表
// 2. 点击列表卡片 -> 地图飞到对应的植物位置并高亮
// 3. 卡片右上角按钮 -> 打开 Google Maps 导航
// 4. 提供 setActiveItemById，给地图那边回调用（点 marker 时高亮列表）

window.PlantList = {
  listEl: null, // 右侧 <ul id="plant-list">

  init() {
    this.listEl = document.querySelector('#plant-list');
    if (!this.listEl) {
      console.warn('PlantList: #plant-list not found');
      return;
    }

    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantList: PlantsData not available');
      return;
    }

    // 渲染完整列表
    this.renderList(window.PlantsData);

    console.log(
      'PlantList: initialized with',
      this.listEl.querySelectorAll('.plant-item').length,
      'items'
    );
  },

  // 根据传入的 plants 数组，重新画一遍右侧列表
  // 过滤器会重复调用这个部分
  renderList(plants) {
    const fragment = document.createDocumentFragment();

    plants.forEach((plant) => {
      const li = document.createElement('li');
      li.className = 'plant-item';
      li.dataset.plantId = plant.id;
      li.tabIndex = 0; // 让整张卡片可以被键盘聚焦

      const nameZh = plant.nameZh
        ? `<span class="plant-name-zh">${plant.nameZh}</span>`
        : '';

      const navAria = plant.nameEn
        ? `Open ${plant.nameEn} location in Google Maps`
        : 'Open plant location in Google Maps';

      // 一张卡片的结构
      li.innerHTML = `
        <div class="plant-item-inner">
          ${
            plant.imageUrl
              ? `<img class="plant-thumb"
                       src="${plant.imageUrl}"
                       alt="${plant.imageAlt || plant.nameEn}">`
              : ''
          }
          <div class="plant-text">
            <div class="plant-title-row">
              <h3 class="plant-name">
                <span class="plant-name-en">${plant.nameEn}</span>
                ${nameZh}
              </h3>
              <button
                type="button"
                class="plant-nav-btn"
                aria-label="${navAria}"
              >
                <img
                  class="plant-nav-icon"
                  src="images/icons/nav.png"
                  alt=""
                  aria-hidden="true"
                >
              </button>
            </div>
            <p class="plant-meta">
              ${plant.scientificName || ''} · ${plant.type || ''}
            </p>
          </div>
        </div>
      `;

      const plantId = plant.id;

      // 点击整张卡片：右侧列表高亮 + 地图聚焦到这个marker
      li.addEventListener('click', () => {
        this.setActiveItem(li);

        if (
          window.PlantMap &&
          typeof window.PlantMap.focusOnPlant === 'function'
        ) {
          window.PlantMap.focusOnPlant(plantId);
        }
      });

      // 导航按钮点击：打开 Google Maps
      const navBtn = li.querySelector('.plant-nav-btn');
      if (navBtn) {
        navBtn.addEventListener('click', (evt) => {
          // 阻止冒泡，避免同时触发上面的 li 点击
          evt.stopPropagation();
          this.openInGoogleMaps(plant);
        });
      }

      fragment.appendChild(li);
    });

    // 用新的 fragment 替换原来的列表内容
    this.listEl.innerHTML = '';
    this.listEl.appendChild(fragment);
  },

  // 打开 Google Maps，定位到这棵植物附近
  openInGoogleMaps(plant) {
    // 这里假设每个 plant 都有 lat / lng
    if (plant.lat == null || plant.lng == null) {
      console.warn('Plant has no coordinates:', plant);
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${plant.lat},${plant.lng}`;

    window.open(url, '_blank', 'noopener');
  },

  // 把某个列表项标记为“当前选中”
  setActiveItem(activeLi) {
    const allItems = this.listEl.querySelectorAll('.plant-item');
    allItems.forEach((item) => {
      item.classList.remove('plant-item-active');
    });
    activeLi.classList.add('plant-item-active');
  },

  // 给地图回调用：传一个 id，右侧列表高亮并滚动过去
  setActiveItemById(id) {
    if (!this.listEl) return;

    const li = this.listEl.querySelector(
      `.plant-item[data-plant-id="${id}"]`
    );
    if (li) {
      this.setActiveItem(li);
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
};
