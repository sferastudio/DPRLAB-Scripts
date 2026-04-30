console.log("dpr-lab-filter.js");
(function () {
  "use strict";

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log("[LabFilter]", ...args);

  const SELECTORS = {
    assetsList: '.grid--3[fs-list-element="list"]',
    filterForm: '[fs-list-element="filters"]',
    keywordInput: 'input[fs-list-field="keyword"]',
    themeInputs: 'input[fs-list-field="theme"]',
    typeInputs: 'input[fs-list-field="type"]',
  };

  function isAnyFilterActive() {
    const keyword = document.querySelector(SELECTORS.keywordInput);
    if (keyword?.value?.trim()) return true;
    if (document.querySelector(`${SELECTORS.themeInputs}:checked`)) return true;
    if (document.querySelector(`${SELECTORS.typeInputs}:checked`)) return true;
    return false;
  }

  function getAssetsWrapper(assetsList) {
    if (!assetsList) return null;
    return assetsList.closest('.w-dyn-list')?.parentElement || assetsList.parentElement;
  }

  function syncAssetsVisibility(assetsWrapper) {
    if (!assetsWrapper) return;
    const show = isAnyFilterActive();
    assetsWrapper.classList.toggle('hide', !show);
    log('Assets section', show ? 'shown' : 'hidden');
  }

  function init() {
    const assetsList = document.querySelector(SELECTORS.assetsList);
    const assetsWrapper = getAssetsWrapper(assetsList);
    const filterForm = document.querySelector(SELECTORS.filterForm);

    if (!assetsList || !filterForm) {
      log('Missing assets list or filter form, retrying...');
      setTimeout(init, 300);
      return;
    }

    log('Init', { assetsList, assetsWrapper, filterForm });

    syncAssetsVisibility(assetsWrapper);

    filterForm.addEventListener('change', () => syncAssetsVisibility(assetsWrapper));
    filterForm.addEventListener('input', () => syncAssetsVisibility(assetsWrapper));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
