/* ============================================
   Tram Dung Chill - Menu Renderer
   Doc du lieu tu data/menu-data.js va tao HTML
   ============================================ */

function renderMenu() {
    var tabsContainer = document.querySelector('.menu-tabs');
    var contentContainer = document.querySelector('.menu-content');
    if (!tabsContainer || !contentContainer) return;

    // Clear existing static content
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    // Build tabs
    MENU_CATEGORIES.forEach(function(cat, i) {
        var btn = document.createElement('button');
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
        var panel = document.createElement('div');
        panel.className = 'menu-panel' + (i === 0 ? ' active' : '');
        panel.id = cat.id;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', 'tab-' + cat.id);
        panel.setAttribute('tabindex', '0');

        var grid = document.createElement('div');
        grid.className = 'menu-grid';

        var items = MENU_ITEMS[cat.id] || [];
        items.forEach(function(item) {
            grid.appendChild(buildMenuItem(item));
        });

        panel.appendChild(grid);

        // Add drink note for drinks category
        if (cat.id === 'douong' && MENU_NOTES.drinks) {
            var note = document.createElement('p');
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
    var el = document.createElement('div');
    el.className = 'menu-item';

    var info = document.createElement('div');
    info.className = 'menu-item-info';

    var h4 = document.createElement('h4');
    h4.textContent = item.name;
    info.appendChild(h4);

    if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'menu-badge hot';
        badge.textContent = item.badge;
        info.appendChild(badge);
    }

    var price = document.createElement('span');
    price.className = 'menu-price';
    price.textContent = item.price;

    el.appendChild(info);
    el.appendChild(price);
    return el;
}

function initMenuTabs() {
    var tabs = document.querySelectorAll('.menu-tab');
    var panels = document.querySelectorAll('.menu-panel');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var target = tab.dataset.tab;
            tabs.forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            var panel = document.getElementById(target);
            if (panel) panel.classList.add('active');
        });
    });

    tabs.forEach(function(t) {
        t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
    });
}
