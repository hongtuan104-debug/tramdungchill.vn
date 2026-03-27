/* ============================================
   Tram Dung Chill - Menu Renderer
   Doc du lieu tu data/menu-data.js va tao HTML
   ============================================ */

function renderMenu() {
    const tabsContainer = document.querySelector('.menu-tabs');
    const contentContainer = document.querySelector('.menu-content');
    if (!tabsContainer || !contentContainer) return;

    // Clear existing static content
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    // Build tabs
    MENU_CATEGORIES.forEach(function(cat, i) {
        const btn = document.createElement('button');
        btn.className = 'menu-tab' + (i === 0 ? ' active' : '');
        btn.setAttribute('data-tab', cat.id);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('id', 'tab-' + cat.id);
        btn.setAttribute('aria-controls', cat.id);
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        btn.textContent = cat.label;
        tabsContainer.appendChild(btn);
    });

    // Build panels
    MENU_CATEGORIES.forEach(function(cat, i) {
        const panel = document.createElement('div');
        panel.className = 'menu-panel' + (i === 0 ? ' active' : '');
        panel.id = cat.id;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', 'tab-' + cat.id);
        panel.setAttribute('tabindex', '0');

        const catTitle = document.createElement('h3');
        catTitle.className = 'menu-panel-title sr-only';
        catTitle.textContent = cat.label;
        panel.appendChild(catTitle);

        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        const items = MENU_ITEMS[cat.id] || [];
        items.forEach(function(item) {
            grid.appendChild(buildMenuItem(item));
        });

        panel.appendChild(grid);

        // Add drink note for drinks category
        if (cat.id === 'douong' && MENU_NOTES.drinks) {
            const note = document.createElement('p');
            note.className = 'menu-drink-note';
            note.textContent = MENU_NOTES.drinks;
            panel.appendChild(note);
        }

        contentContainer.appendChild(panel);
    });

    // Wire up tab click events after DOM is built
    initMenuTabs();
}

function buildMenuItem(item) {
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
        badge.className = 'menu-badge hot';
        badge.textContent = item.badge;
        info.appendChild(badge);
    }

    const price = document.createElement('span');
    price.className = 'menu-price';
    price.textContent = item.price;

    el.appendChild(info);
    el.appendChild(price);
    return el;
}

function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const panels = document.querySelectorAll('.menu-panel');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const target = tab.dataset.tab;
            tabs.forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const panel = document.getElementById(target);
            if (panel) panel.classList.add('active');
        });
    });

    tabs.forEach(function(t) {
        t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
    });
}
