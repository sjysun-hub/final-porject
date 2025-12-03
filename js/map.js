// js/map.js
// 功能：
// 1. 初始化 MapLibre 地图
// 2. 把 PlantsData 里的每一棵植物画成一个 marker
// 3. 列表和地图之间可以互相联动（点击列表聚焦地图 / 点击 marker 高亮列表）
// 4. 根据过滤结果显示 / 隐藏 marker

window.PlantMap = {
  map: null,          // MapLibre 地图实例
  markers: {},        // 用 id 存每一个 marker：{ [id]: marker }
  activeMarkerId: null,


  init() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.warn('Map container #map not found.');
      return;
    }

    const MAPTILER_KEY = 'jLonpm0xNpIC9eNx6T3d';

    // 创建地图
    this.map = new maplibregl.Map({
      container: 'map',
      style: `https://api.maptiler.com/maps/aquarelle/style.json?key=${MAPTILER_KEY}`,
      center: [-83.7430, 42.2808],  // Ann Arbor 大概位置
      zoom: 13
    });

    // 右上角的缩放控件
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (!Array.isArray(window.PlantsData)) {
      console.warn('PlantsData not available.');
      return;
    }

    // 等地图加载完，再加点
    this.map.on('load', () => {
      window.PlantsData.forEach((plant) => {
        // 没有坐标就不画点
        if (plant.lat == null || plant.lng == null) return;
        this.addPlantMarker(plant);
      });

      console.log(
        'PlantMap: markers added =',
        Object.keys(this.markers).length
      );
    });
  },

  // 把一条 plant 数据变成地图上的一个 marker
  addPlantMarker(plant) {
    const { id, lat, lng, nameEn, nameZh } = plant;
    const label = nameZh ? `${nameEn} (${nameZh})` : nameEn;

    // 自己做一个小圆点，当作 marker 的 DOM 元素
    const el = document.createElement('div');
    el.className = 'plant-marker';
    el.dataset.plantId = id; // 之后高亮用

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])   // 注意顺序：[lng, lat]
      .setPopup(new maplibregl.Popup().setText(label))
      .addTo(this.map);

    const markerEl = marker.getElement();
    if (markerEl) {

      // 不希望 marker 被键盘聚焦，读屏读出（有列表就够了）
      markerEl.removeAttribute('tabindex');
      markerEl.removeAttribute('aria-label');
      markerEl.setAttribute('aria-hidden', 'true');

      // 再给它挂一次 plantId，保证查询能找到（高亮用）
      markerEl.dataset.plantId = id;
    }

    // 点击地图上的点：自己高亮 + 右侧列表也高亮、滚动过去
    (markerEl || el).addEventListener('click', () => {
      this.setActiveMarkerById(id);

      if (
        window.PlantList &&
        typeof window.PlantList.setActiveItemById === 'function'
      ) {
        window.PlantList.setActiveItemById(id);
      }
    });

    // 把这个 marker 存起来，方便后面通过 id 找它
    this.markers[id] = marker;
  },

  // 从列表那边调用：让地图飞到对应植物，并打开弹窗，同时标记为当前 active
  focusOnPlant(id) {
    const marker = this.markers[id];

    if (marker && this.map) {
      const lngLat = marker.getLngLat();
      this.map.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 15,
        essential: true
      });

      const popup = marker.getPopup();
      if (popup) {
        popup.addTo(this.map);
      }
    }

    this.setActiveMarkerById(id);
  },

  // 改 marker 的样式（橙色高亮 / 取消高亮）
  setActiveMarkerById(id) {
    // 去掉旧的高亮
    const prev = document.querySelector('.plant-marker.plant-marker--active');
    if (prev) {
      prev.classList.remove('plant-marker--active');
    }

    // 给当前这个 id 对应的 marker 加高亮样式
    const current = document.querySelector(
      `.plant-marker[data-plant-id="${id}"]`
    );
    if (current) {
      current.classList.add('plant-marker--active');
      this.activeMarkerId = id;
    } else {
      this.activeMarkerId = null;
    }
  },

  // 根据过滤后的 id 列表。显示，隐藏哪些 marker
  // 如果是空数组或 null，就当“全部显示”
  setVisibleIds(visibleIds) {
    const visibleSet = new Set(visibleIds || []);

    Object.entries(this.markers).forEach(([id, marker]) => {
      if (!marker || typeof marker.getElement !== 'function') return;
      const el = marker.getElement();
      if (!el) return;

      if (visibleSet.size === 0 || visibleSet.has(id)) {
        el.style.display = '';     // 显示
      } else {
        el.style.display = 'none'; // 隐藏
      }
    });
  }
};
