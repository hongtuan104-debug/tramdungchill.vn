/* ============================================
   Menu Page Renderer - Tram Dung Chill
   Render trang menu tu data/menu-data.js
   ============================================ */

function renderMenuPage() {
    var container = document.querySelector('.menu-page-content');
    if (!container || typeof MENU_CATEGORIES === 'undefined' || typeof MENU_ITEMS === 'undefined') return;

    container.innerHTML = '';

    MENU_CATEGORIES.forEach(function(cat) {
        var section = document.createElement('div');
        section.className = 'menu-category' + (cat.id === 'bestseller' ? ' menu-category--bestseller' : '');
        section.id = cat.id;

        var header = '<div class="menu-category-header"><h2 class="menu-category-name">' + cat.label + '</h2></div>';
        var items = MENU_ITEMS[cat.id] || [];
        var grid = '<div class="menu-grid">';

        items.forEach(function(item) {
            var badgeHtml = '';
            if (item.badge) {
                var badgeClass = item.badge.toLowerCase();
                badgeHtml = ' <span class="menu-item-badge menu-item-badge--' + badgeClass + '">' + item.badge + '</span>';
            }
            grid += '<div class="menu-item">' +
                '<div class="menu-item-info">' +
                    '<span class="menu-item-name">' + item.name + badgeHtml + '</span>' +
                '</div>' +
                '<span class="menu-item-price">' + item.price + '</span>' +
            '</div>';
        });

        grid += '</div>';
        section.innerHTML = header + grid;
        container.appendChild(section);
    });

    // Add note
    if (typeof MENU_NOTES !== 'undefined') {
        var note = document.createElement('div');
        note.className = 'menu-note';
        note.innerHTML = '<p>' + MENU_NOTES.general + '</p>';
        container.appendChild(note);
    }
}
