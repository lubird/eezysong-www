/**
 * Wix Pro Gallery Carousel Shim
 * 
 * This script restores functionality to the Wix Pro Gallery carousel
 * by bypassing the Thunderbolt framework (which requires Web Workers
 * and fails on file:// protocols).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Extraction
    const warmupDataScript = document.getElementById('wix-warmup-data');
    if (!warmupDataScript) return;

    let galleryItems = [];
    try {
        const warmupData = JSON.parse(warmupDataScript.textContent);
        const appsData = warmupData.appsWarmupData;

        // Find the gallery app data (usually starts with 14271d6f)
        const galleryAppId = Object.keys(appsData).find(key => appsData[key]['comp-l4etm7h21_galleryData']);
        if (galleryAppId) {
            galleryItems = appsData[galleryAppId]['comp-l4etm7h21_galleryData'].items;
        }
    } catch (e) {
        console.error('Failed to parse wix-warmup-data for carousel:', e);
        return;
    }

    if (!galleryItems || galleryItems.length === 0) return;

    // 2. DOM Elements
    const galleryScrollContainer = document.getElementById('gallery-horizontal-scroll-comp-l4etm7h21');
    if (!galleryScrollContainer) return;

    const scrollInner = galleryScrollContainer.querySelector('.gallery-horizontal-scroll-inner');
    const groupViews = scrollInner.querySelectorAll('[data-hook="group-view"]');

    // We expect the first 2 group views to be present from the static HTML
    if (groupViews.length < 2) return;

    // Use the first item as a template
    const templateItem = groupViews[0];
    const itemWidth = 900; // Fixed width from Wix inline styles

    // Create fragments for main images and thumbnails
    const mainImagesFragment = document.createDocumentFragment();

    // Find thumbnail container
    const thumbnailsGallery = document.querySelector('.pro-gallery.thumbnails-gallery');

    // 3. Dynamic DOM Generation for missing items (index 2 onwards)
    // First, let's look at the thumbnail generation and main images

    // The Wix static HTML only generates the first 2 main images.
    // Let's generate the rest.
    for (let i = groupViews.length; i < galleryItems.length; i++) {
        const itemData = galleryItems[i];
        const prevGroupView = groupViews[0]; // Clone the first one

        const newGroupView = prevGroupView.cloneNode(true);
        const leftPos = i * itemWidth;
        newGroupView.style.setProperty('--group-left', `${leftPos}px`);

        // Update IDs, attributes, and image sources
        const itemId = itemData.itemId;
        const noDashId = itemId.replace(/-/g, '');

        const linkWrapper = newGroupView.querySelector('.item-link-wrapper');
        linkWrapper.setAttribute('data-id', itemId);
        linkWrapper.setAttribute('data-idx', i.toString());

        const itemContainer = newGroupView.querySelector('.gallery-item-container');
        itemContainer.id = `pgi${noDashId}_${i}`;
        itemContainer.setAttribute('data-hash', itemId);
        itemContainer.setAttribute('data-id', itemId);
        itemContainer.setAttribute('data-idx', i.toString());
        itemContainer.style.left = `${leftPos}px`;
        itemContainer.setAttribute('aria-hidden', 'true');

        const itemAction = newGroupView.querySelector('.item-action');
        itemAction.id = `item-action-${itemId}`;
        itemAction.setAttribute('data-idx', i.toString());
        itemAction.setAttribute('aria-label', itemData.metaData.title || itemData.metaData.alt);

        const itemWrapper = newGroupView.querySelector('.gallery-item-wrapper');
        itemWrapper.id = `item-wrapper-${itemId}`;

        const imgElement = newGroupView.querySelector('img.gallery-item');
        imgElement.id = itemId;
        imgElement.setAttribute('data-idx', i.toString());
        imgElement.alt = itemData.metaData.alt;

        // Map filename ~ to _ for HTTrack local archiving
        let localImgName = itemData.mediaUrl.replace('~', '_');

        // HTTrack renames items with hashes so we need an explicit mapping
        const imageMap = {
            '0d45d0_08057b3b5baf4d2086c993a19843fde6_mv2.jpg': '269ff931a249_0d45d0_08057b3b5baf4d2086c993a19843fde6_mv2.jpg',
            '0d45d0_9144a3aaf99747a7b0feb8433adf163f_mv2.jpg': '78547ea89c20_0d45d0_9144a3aaf99747a7b0feb8433adf163f_mv2.34.de',
            '0d45d0_07330a4d67f84a9ba43a6e7dbc27c61e_mv2.jpg': '3305c833eba1_0d45d0_07330a4d67f84a9ba43a6e7dbc27c61e_mv2.jpg',
            '0d45d0_fbde8e811b0d4297943302e6170ceaa1_mv2.jpg': 'eb2c2a09d0bd_0d45d0_fbde8e811b0d4297943302e6170ceaa1_mv2.jpg'
        };

        if (imageMap[localImgName]) {
            localImgName = imageMap[localImgName];
        }

        imgElement.src = `img/${localImgName}`;

        // Remove the picture element sources as they point to hashed names we don't have
        // or just let the img tag fallback work. Better yet, clear the <source> tags.
        const pictureElement = newGroupView.querySelector('picture');
        if (pictureElement) {
            const sources = pictureElement.querySelectorAll('source');
            sources.forEach(src => src.remove());
        }

        mainImagesFragment.appendChild(newGroupView);
    }

    scrollInner.appendChild(mainImagesFragment);

    // 4. Navigation Logic
    // Find the Next arrow from the static HTML
    let nextArrowBtn = document.querySelector('[data-hook="nav-arrow-next"]');

    // We need to create a Back arrow button (it's missing from static HTML initially)
    let prevArrowBtn = document.querySelector('[data-hook="nav-arrow-prev"]');
    if (!prevArrowBtn && nextArrowBtn) {
        prevArrowBtn = nextArrowBtn.cloneNode(true);
        prevArrowBtn.setAttribute('data-hook', 'nav-arrow-prev');
        prevArrowBtn.setAttribute('aria-label', 'Previous Item');
        // Mirror the SVG or replace it for "Back"
        prevArrowBtn.style.left = '23px';
        prevArrowBtn.style.right = 'auto'; // ensure right is auto
        // The next arrow has right positioning, prev should have left

        // Replace the SVG with a left-pointing arrow (rotate 180deg)
        const svg = prevArrowBtn.querySelector('svg');
        if (svg) {
            svg.style.transform = 'rotate(180deg)';
        }

        // Initially hide back arrow
        prevArrowBtn.style.display = 'none';

        nextArrowBtn.parentNode.insertBefore(prevArrowBtn, nextArrowBtn);
    }

    // Scroll state
    let currentIndex = 0;
    const totalItems = galleryItems.length;

    function updateCarousel() {
        const offset = -(currentIndex * itemWidth);

        // Apply transform to the INNER wrapper, that's how Wix handles sliding
        const itemContainers = scrollInner.querySelectorAll('.gallery-item-container');
        itemContainers.forEach((container, i) => {
            // Wix sets `translate3d` on each container or the parent?
            // Actually it's easier to just scroll the container or translate the inner div.
        });

        // Wix uses overflow-x on .gallery-horizontal-scroll
        galleryScrollContainer.scrollTo({
            left: currentIndex * itemWidth,
            behavior: 'smooth'
        });

        // Update active class on item containers
        itemContainers.forEach((container, i) => {
            if (i === currentIndex) {
                container.setAttribute('aria-hidden', 'false');
                container.classList.add('visible');
            } else {
                container.setAttribute('aria-hidden', 'true');
                // container.classList.remove('visible'); // keep visible to allow scrolling
            }
        });

        // Toggle arrow visibility
        if (prevArrowBtn) {
            prevArrowBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        }
        if (nextArrowBtn) {
            nextArrowBtn.style.display = currentIndex === totalItems - 1 ? 'none' : 'flex';
        }

        // Sync Thumbnails if present
        syncThumbnails();
    }

    if (nextArrowBtn) {
        nextArrowBtn.addEventListener('click', () => {
            if (currentIndex < totalItems - 1) {
                currentIndex++;
                updateCarousel();
            }
        });
    }

    if (prevArrowBtn) {
        prevArrowBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }

    // 5. Thumbnails Logic
    // Unfortunately, the static HTML might not have rendered all thumbnails either.
    // Let's find out how thumbnails are structured.
    const thumbnailsContainer = document.querySelector('.pro-gallery.thumbnails-gallery .galleryColumn');

    if (thumbnailsContainer) {
        const thumbnailItems = thumbnailsContainer.querySelectorAll('.thumbnailItem');

        function syncThumbnails() {
            const allThumbs = thumbnailsContainer.querySelectorAll('.thumbnailItem');
            allThumbs.forEach((thumb, i) => {
                if (i === currentIndex) {
                    thumb.classList.add('pro-gallery-highlight');
                } else {
                    thumb.classList.remove('pro-gallery-highlight');
                }
            });

            // Scroll thumbnail container into view if needed
            const activeThumb = allThumbs[currentIndex];
            if (activeThumb) {
                // Get the scroll container for thumbnails
                const thumbScrollContainer = thumbnailsContainer.closest('.pro-gallery.inline-styles.thumbnails-gallery');
                if (thumbScrollContainer) {
                    // Simple center logic
                    const thumbLeft = parseInt(activeThumb.style.left || 0);
                    // thumbScrollContainer.scrollTo({left: thumbLeft - 400, behavior: 'smooth'}); 
                }
            }
        }

        // Adding click listeners to existing thumbnails
        thumbnailItems.forEach((thumb, i) => {
            thumb.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
            });
            // Also need styles for the hover highlights.
        });

        // If there are missing thumbnails, generate them too
        if (thumbnailItems.length < totalItems && thumbnailItems.length > 0) {
            const thumbTemplate = thumbnailItems[0];
            const thumbWidth = parseInt(thumbTemplate.style.width) || 120;
            const thumbMargin = parseInt(thumbTemplate.style.marginRight) || 10; // estimate

            for (let i = thumbnailItems.length; i < totalItems; i++) {
                const itemData = galleryItems[i];
                const newThumb = thumbTemplate.cloneNode(true);

                // Adjust position
                // Wix positions absolute
                const leftPos = i * (136 + 6); // Just an estimate, check DOM for actual step
                // Let's calculate step from thumb 0 and 1 if available
                let step = 142; // default guess based on 136w + 6 gap
                if (thumbnailItems.length >= 2) {
                    const left0 = parseInt(thumbnailItems[0].style.left) || 0;
                    const left1 = parseInt(thumbnailItems[1].style.left) || 0;
                    step = left1 - left0;
                }

                newThumb.style.left = `${i * step}px`;
                newThumb.setAttribute('data-idx', i.toString());
                newThumb.classList.remove('pro-gallery-highlight');

                // Background image
                let localImgName = itemData.mediaUrl.replace('~', '_');
                if (imageMap[localImgName]) {
                    localImgName = imageMap[localImgName];
                }
                newThumb.style.backgroundImage = `url(img/${localImgName})`;

                newThumb.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });

                thumbnailsContainer.appendChild(newThumb);
            }
        }
    }
});
