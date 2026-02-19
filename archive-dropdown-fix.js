(function () {
  if (window.__archiveDropdownFixApplied) return;
  window.__archiveDropdownFixApplied = true;

  function isHomePage() {
    var path = (window.location.pathname || '').toLowerCase();
    return path === '/' || path.endsWith('/index.html');
  }

  function isElementVisible(el) {
    if (!el) return false;
    var computed = window.getComputedStyle(el);
    if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
      return false;
    }
    var rect = el.getBoundingClientRect();
    return rect.height > 20 && rect.width > 20;
  }

  function ensureAnnouncementBar() {
    if (!isHomePage()) return;
    var original = document.getElementById('comp-jk11zpi4');
    if (isElementVisible(original)) return;
    if (document.getElementById('archive-announcement-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'archive-announcement-bar';
    bar.innerHTML =
      '<p>&gt;&gt; NEW &amp; NOW selling HOT on Amazon &lt;&lt;<br>' +
      '<a href="https://www.amazon.com/Charcuterie-Utensil-Cutlery-Storage-Serving/dp/B096F9VLKC?maas=maas_adg_3C0EFBD3C4218B229C3E16549BCE071C_afap_abs&amp;ref_=aa_maas&amp;tag=maas" target="_blank" rel="noreferrer noopener">CHEESE BOARD</a>' +
      ' and ' +
      '<a href="https://www.amazon.com/Persons-Insulated-Tableware-Glasses-Utensils/dp/B09V1WBY5V?maas=maas_adg_544D6425FB02A3D167EDBD1A418A3A4F_afap_abs&amp;ref_=aa_maas&amp;tag=maas" target="_blank" rel="noreferrer noopener">PICNIC BASKET</a>' +
      '</p>';

    var header = document.getElementById('SITE_HEADER');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(bar, header);
      return;
    }

    document.body.insertBefore(bar, document.body.firstChild);
  }

  ensureAnnouncementBar();
})();
