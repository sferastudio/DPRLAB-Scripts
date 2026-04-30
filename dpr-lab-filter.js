console.log("dpr-lab-filter.js");
(function () {
  "use strict";

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log("[LabFilter]", ...args);

  const SELECTORS = {
    topicsList: '.topics_list',
    assetsList: '.grid--3[fs-list-element="list"]',
    filterForm: '[fs-list-element="filters"]',
    contentTypeInputs: 'input[fs-list-field="type"]',
    topicCard: '[data-topic-slug]',
    assetTopicSlug: '[data-asset-topic-slug]',
    dynItem: '.w-dyn-item',
    dynEmpty: '.w-dyn-empty',
  };

  function isContentTypeSelected() {
    return !!document.querySelector(`${SELECTORS.contentTypeInputs}:checked`);
  }

  function isAssetVisible(item) {
    if (!item) return false;
    if (item.hasAttribute('fs-list-hidden')) return false;
    if (item.style.display === 'none') return false;
    return true;
  }

  function getAssetsWrapper(assetsList) {
    if (!assetsList) return null;
    return assetsList.closest('.w-dyn-list')?.parentElement || assetsList.parentElement;
  }

  function syncAssetsVisibility(assetsWrapper) {
    if (!assetsWrapper) return;
    const show = isContentTypeSelected();
    assetsWrapper.style.display = show ? '' : 'none';
    log('Assets section', show ? 'shown' : 'hidden');
  }

  function collectVisibleAssetTopicSlugs(assetsList) {
    const slugs = new Set();
    if (!assetsList) return slugs;
    assetsList.querySelectorAll(SELECTORS.dynItem).forEach((item) => {
      if (!isAssetVisible(item)) return;
      item.querySelectorAll(SELECTORS.assetTopicSlug).forEach((el) => {
        const s = (el.textContent || '').trim();
        if (s) slugs.add(s);
      });
    });
    return slugs;
  }

  function syncTopics(topicsList, assetsList) {
    if (!topicsList) return;

    const slugs = collectVisibleAssetTopicSlugs(assetsList);
    let visibleCount = 0;

    topicsList.querySelectorAll(SELECTORS.topicCard).forEach((card) => {
      const cardItem = card.closest(SELECTORS.dynItem) || card;
      const slug = card.getAttribute('data-topic-slug');
      const show = slug && slugs.has(slug);
      cardItem.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    const wrapper = topicsList.closest('.w-dyn-list')?.parentElement || topicsList.parentElement;
    const empty = wrapper?.querySelector(SELECTORS.dynEmpty);
    if (empty) empty.style.display = visibleCount === 0 ? '' : 'none';

    log('Topics visible:', visibleCount);
  }

  function init() {
    const topicsList = document.querySelector(SELECTORS.topicsList);
    const assetsList = document.querySelector(SELECTORS.assetsList);
    const assetsWrapper = getAssetsWrapper(assetsList);
    const filterForm = document.querySelector(SELECTORS.filterForm);

    if (!topicsList || !assetsList) {
      log('Missing topics or assets list, retrying...');
      setTimeout(init, 300);
      return;
    }

    log('Init', { topicsList, assetsList, assetsWrapper, filterForm });

    let pending;
    const sync = () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        syncAssetsVisibility(assetsWrapper);
        syncTopics(topicsList, assetsList);
      }, 80);
    };

    sync();

    filterForm?.addEventListener('change', sync);
    filterForm?.addEventListener('input', sync);

    const observer = new MutationObserver(sync);
    observer.observe(assetsList, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'fs-list-hidden', 'hidden'],
    });
  }

  if (window.FinsweetAttributes?.modules?.list) {
    init();
  } else {
    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push(['list', () => init()]);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
      setTimeout(init, 200);
    }
  }
})();
