(() => {
  const GALLERY_ROOT_ID = "pro-gallery-comp-l4etlpk6";
  const SCROLL_ID = "gallery-horizontal-scroll-comp-l4etlpk6";
  const WARMUP_ID = "wix-warmup-data";

  const ITEM_IMAGE_MAP = {
    "3b13f749-53fd-4117-893d-d26284632a85":
      "img/picnic_full_10fd776949344418b11bf59cfd6a1b36_mv2.jpg",
    "cbc1b30d-99fa-459e-ad86-ecda9c2921a7":
      "img/picnic_full_3ac7814d8c5d497699f0e3ada9bd4a47_mv2.jpg",
    "02eff9dc-2c6d-48d3-b7c9-b252424b230b":
      "img/picnic_full_3e237e9ad30541169e12b79934c7b01b_mv2.jpg",
    "534e10df-5fd8-4531-b3fc-d3c603422958":
      "img/picnic_full_526180a5fceb4026b8abc09f3958829c_mv2.jpg",
    "09ce980e-c9a4-497a-8bf8-ddcf33a78a6f":
      "img/picnic_full_b0d6e0ea083a45e6a3c6ccc3ccc2152c_mv2.jpg",
  };

  const onReady = () => {
    const galleryRoot = document.getElementById(GALLERY_ROOT_ID);
    if (!galleryRoot) return;

    const scrollContainer = document.getElementById(SCROLL_ID);
    const scrollInner = scrollContainer?.querySelector(".gallery-horizontal-scroll-inner");
    if (!scrollContainer || !scrollInner) return;

    const warmupScript = document.getElementById(WARMUP_ID);
    let warmupItems = [];
    if (warmupScript) {
      try {
        const warmupData = JSON.parse(warmupScript.textContent || "{}");
        const appsWarmupData = warmupData?.appsWarmupData || {};
        const appId = Object.keys(appsWarmupData).find((key) =>
          Boolean(appsWarmupData[key]?.["comp-l4etlpk6_galleryData"]?.items)
        );
        warmupItems = appId
          ? appsWarmupData[appId]["comp-l4etlpk6_galleryData"].items || []
          : [];
      } catch (_) {
        warmupItems = [];
      }
    }

    const thumbnailNodes = Array.from(
      galleryRoot.querySelectorAll(".thumbnails-gallery .thumbnailItem")
    );
    const totalItems = Math.max(warmupItems.length, thumbnailNodes.length);
    if (totalItems < 2) return;

    const groupViews = Array.from(scrollInner.querySelectorAll('[data-hook="group-view"]'));
    if (groupViews.length === 0) return;

    const templateGroup = groupViews[0];
    const firstContainer = templateGroup.querySelector(".gallery-item-container");
    const itemWidth = firstContainer?.offsetWidth || scrollContainer.clientWidth || 900;
    const itemHeight = firstContainer?.offsetHeight || scrollContainer.clientHeight || 889;

    const getThumbUrl = (index) => {
      const node = thumbnailNodes[index];
      const bg = node?.style?.backgroundImage || "";
      const match = bg.match(/url\((['"]?)(.*?)\1\)/i);
      return match ? match[2] : "";
    };

    const getItemAt = (index) => warmupItems[index] || null;

    const normalizeGroup = (group, index, options = {}) => {
      const { preserveExistingSrc = false } = options;
      const item = getItemAt(index);
      const itemId = item?.itemId || `archive-item-${index}`;
      const normalizedId = itemId.replace(/-/g, "");
      const leftPos = index * itemWidth;

      group.style.setProperty("--group-top", "0px");
      group.style.setProperty("--group-left", `${leftPos}px`);
      group.style.setProperty("--group-width", `${itemWidth}px`);
      group.style.setProperty("--group-right", "auto");
      group.setAttribute("aria-hidden", index === 0 ? "false" : "true");

      const linkWrapper = group.querySelector(".item-link-wrapper");
      if (linkWrapper) {
        linkWrapper.dataset.id = itemId;
        linkWrapper.dataset.idx = String(index);
      }

      const container = group.querySelector(".gallery-item-container");
      if (container) {
        container.id = `pgi${normalizedId}_${index}`;
        container.dataset.hash = itemId;
        container.dataset.id = itemId;
        container.dataset.idx = String(index);
        container.style.left = `${leftPos}px`;
        container.style.width = `${itemWidth}px`;
        container.style.height = `${itemHeight}px`;
        container.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      }

      const action = group.querySelector(".item-action");
      if (action) {
        action.id = `item-action-${itemId}`;
        action.dataset.idx = String(index);
        action.tabIndex = index === 0 ? 0 : -1;
        if (item?.metaData?.alt || item?.metaData?.title) {
          action.setAttribute("aria-label", item.metaData.alt || item.metaData.title);
        }
      }

      const wrapper = group.querySelector(".gallery-item-wrapper");
      if (wrapper) {
        wrapper.id = `item-wrapper-${itemId}`;
        wrapper.style.width = `${itemWidth}px`;
        wrapper.style.height = `${itemHeight}px`;
      }

      const img = group.querySelector("img.gallery-item, img[data-hook='gallery-item-image-img']");
      if (img) {
        const existingSrc = img.getAttribute("src") || "";
        img.id = itemId;
        img.dataset.idx = String(index);
        img.style.width = `${itemWidth}px`;
        img.style.height = `${itemHeight}px`;
        img.alt = item?.metaData?.alt || img.alt || "";

        const mappedSrc = ITEM_IMAGE_MAP[itemId];
        const thumbSrc = getThumbUrl(index);
        let resolvedSrc = existingSrc;
        if (mappedSrc) {
          resolvedSrc = mappedSrc;
        } else if (!preserveExistingSrc && thumbSrc) {
          resolvedSrc = thumbSrc;
        }
        if (resolvedSrc) {
          img.src = resolvedSrc;
        }
      }

      const picture = group.querySelector("picture");
      if (picture && !preserveExistingSrc) {
        picture.querySelectorAll("source").forEach((source) => source.remove());
      }
    };

    for (let i = 0; i < groupViews.length; i += 1) {
      normalizeGroup(groupViews[i], i, { preserveExistingSrc: true });
    }

    if (groupViews.length < totalItems) {
      const fragment = document.createDocumentFragment();
      for (let i = groupViews.length; i < totalItems; i += 1) {
        const clone = templateGroup.cloneNode(true);
        normalizeGroup(clone, i);
        fragment.appendChild(clone);
      }
      scrollInner.appendChild(fragment);
    }

    const allGroupViews = Array.from(scrollInner.querySelectorAll('[data-hook="group-view"]'));
    const allContainers = allGroupViews
      .map((group) => group.querySelector(".gallery-item-container"))
      .filter(Boolean);
    const allActions = allGroupViews
      .map((group) => group.querySelector(".item-action"))
      .filter(Boolean);

    let nextArrow = galleryRoot.querySelector('[data-hook="nav-arrow-next"]');
    if (!nextArrow) return;

    let prevArrow = galleryRoot.querySelector('[data-hook="nav-arrow-prev"]');
    if (!prevArrow) {
      prevArrow = nextArrow.cloneNode(true);
      prevArrow.setAttribute("data-hook", "nav-arrow-prev");
      prevArrow.setAttribute("aria-label", "Previous Item");
      prevArrow.style.left = "23px";
      prevArrow.style.right = "auto";
      const svg = prevArrow.querySelector("svg");
      if (svg) svg.style.transform = "scaleX(-1) scale(1)";
      nextArrow.parentNode?.insertBefore(prevArrow, nextArrow);
    }

    const thumbnailBar = galleryRoot.querySelector(".thumbnails-gallery .galleryColumn");
    const allThumbs = () =>
      Array.from(thumbnailBar?.querySelectorAll(".thumbnailItem") || []);

    let currentIndex = 0;

    const render = () => {
      scrollContainer.scrollTo({
        left: currentIndex * itemWidth,
        behavior: "smooth",
      });

      allGroupViews.forEach((group, idx) => {
        group.setAttribute("aria-hidden", idx === currentIndex ? "false" : "true");
      });

      allContainers.forEach((container, idx) => {
        container.setAttribute("aria-hidden", idx === currentIndex ? "false" : "true");
      });

      allActions.forEach((action, idx) => {
        action.tabIndex = idx === currentIndex ? 0 : -1;
      });

      allThumbs().forEach((thumb, idx) => {
        thumb.classList.toggle("pro-gallery-highlight", idx === currentIndex);
      });
    };

    nextArrow.addEventListener("click", (event) => {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % totalItems;
      render();
    });

    prevArrow.addEventListener("click", (event) => {
      event.preventDefault();
      currentIndex = (currentIndex - 1 + totalItems) % totalItems;
      render();
    });

    allThumbs().forEach((thumb, idx) => {
      thumb.addEventListener("click", () => {
        currentIndex = idx;
        render();
      });
      thumb.style.cursor = "pointer";
      thumb.tabIndex = 0;
      thumb.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          currentIndex = idx;
          render();
        }
      });
    });

    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
