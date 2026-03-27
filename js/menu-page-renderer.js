/* ============================================
   Menu Page Renderer - Tram Dung Chill
   Render trang menu tu data/menu-data.js
   Uses safe DOM methods (no innerHTML for data)
   ============================================ */

function renderMenuPage() {
    const container = document.querySelector('.menu-page-content');
    if (!container || typeof MENU_CATEGORIES === 'undefined' || typeof MENU_ITEMS === 'undefined') return;

    container.innerHTML = '';

    MENU_CATEGORIES.forEach(function(cat) {
        const section = document.createElement('div');
        section.className = 'menu-category' + (cat.id === 'bestseller' ? ' menu-category--bestseller' : '');
        section.id = cat.id;

        // Category header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'menu-category-header';
        const h2 = document.createElement('h2');
        h2.className = 'menu-category-name';
        h2.textContent = cat.label;
        headerDiv.appendChild(h2);
        section.appendChild(headerDiv);

        // Items grid
        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        const items = MENU_ITEMS[cat.id] || [];
        items.forEach(function(item) {
            grid.appendChild(buildMenuPageItem(item));
        });

        section.appendChild(grid);
        container.appendChild(section);
    });

    // Add notes using safe DOM methods
    if (typeof MENU_NOTES !== 'undefined') {
        const note = document.createElement('div');
        note.className = 'menu-note';

        const pGeneral = document.createElement('p');
        pGeneral.textContent = MENU_NOTES.general;
        note.appendChild(pGeneral);

        if (MENU_NOTES.holiday) {
            const pHoliday = document.createElement('p');
            pHoliday.textContent = MENU_NOTES.holiday;
            note.appendChild(pHoliday);
        }
        if (MENU_NOTES.drinks) {
            const pDrinks = document.createElement('p');
            pDrinks.textContent = MENU_NOTES.drinks;
            note.appendChild(pDrinks);
        }
        container.appendChild(note);
    }
}

function buildMenuPageItem(item) {
    const el = document.createElement('div');
    el.className = 'menu-item';

    const info = document.createElement('div');
    info.className = 'menu-item-info';

    const nameEl = document.createElement('span');
    nameEl.className = 'menu-item-name';
    nameEl.textContent = item.name;
    info.appendChild(nameEl);

    if (item.badge) {
        const badge = document.createElement('span');
        const badgeClass = item.badge.toLowerCase().replace(/\s+/g, '-');
        badge.className = 'menu-item-badge menu-item-badge--' + badgeClass;
        badge.textContent = item.badge;
        info.appendChild(badge);
    }

    const price = document.createElement('span');
    price.className = 'menu-item-price';
    price.textContent = item.price;

    el.appendChild(info);
    el.appendChild(price);
    return el;
}
