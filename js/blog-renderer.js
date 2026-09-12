/* ============================================
   Blog Renderer - Tram Dung Chill
   Render bai viet tu data/blog-data.js
   Uses safe DOM methods — no innerHTML for data
   formatDateVi() is in utils.js (shared)
   ============================================ */

function renderBlog() {
    const grid = document.querySelector('.blog-grid');
    if (!grid || typeof BLOG_ARTICLES === 'undefined') return;

    grid.innerHTML = '';

    // Auto-schedule: only show articles with date <= today
    const today = new Date().toISOString().slice(0, 10);
    const articles = BLOG_ARTICLES.filter(function(a) { return a.date <= today; });

    articles.forEach(function(article) {
        grid.appendChild(buildBlogCard(article));
    });

    // Auto-insert share buttons
    initBlogShare();

    // Init category filters
    initBlogFilters(articles);

    // Init search
    initBlogSearch();

    // Trả lại trạng thái lọc ghi trong URL — phải chạy SAU hai hàm init trên,
    // vì nó cần các nút danh mục đã dựng xong mới tô đúng nút đang chọn.
    khoiPhucTuURL();
}

function buildBlogCard(article) {
    const card = document.createElement('article');
    card.className = 'blog-card' + (article.featured ? ' blog-featured' : '');
    card.id = article.id;

    // Image container
    const imgDiv = document.createElement('div');
    imgDiv.className = 'blog-card-img';

    const img = document.createElement('img');
    img.src = article.image;
    img.srcset = article.image.replace(/\.(jpg|webp)$/i, '-400w.webp') + ' 400w, ' +
                 article.image.replace(/\.(jpg|webp)$/i, '-800w.webp') + ' 800w, ' +
                 article.image + ' 1200w';
    img.sizes = '(max-width:480px) 400px, (max-width:768px) 800px, 1200px';
    img.alt = article.imageAlt || '';
    img.loading = 'lazy';
    imgDiv.appendChild(img);

    if (article.badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'blog-badge';
        badgeEl.textContent = article.badge;
        imgDiv.appendChild(badgeEl);
    }

    card.appendChild(imgDiv);

    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'blog-card-content';

    // Meta
    const metaDiv = document.createElement('div');
    metaDiv.className = 'blog-meta';

    const timeEl = document.createElement('time');
    timeEl.setAttribute('datetime', article.date);
    timeEl.textContent = formatDateVi(article.date);
    metaDiv.appendChild(timeEl);

    const catSpan = document.createElement('span');
    catSpan.className = 'blog-category';
    catSpan.textContent = article.category;
    metaDiv.appendChild(catSpan);

    contentDiv.appendChild(metaDiv);

    // Title
    const h2 = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = 'blog/' + article.id + '.html';
    titleLink.textContent = article.title;
    h2.appendChild(titleLink);
    contentDiv.appendChild(h2);

    // Excerpt (may contain safe HTML like <strong>)
    const excerptP = document.createElement('p');
    excerptP.textContent = article.excerpt.replace(/<[^>]*>/g, '');
    contentDiv.appendChild(excerptP);

    // Read more link
    const readMore = document.createElement('a');
    readMore.href = 'blog/' + article.id + '.html';
    readMore.className = 'blog-read-more';
    readMore.textContent = t('blog.readmore', 'Đọc tiếp →');
    contentDiv.appendChild(readMore);

    card.appendChild(contentDiv);
    return card;
}

function initBlogFilters(articles) {
    const filtersContainer = document.getElementById('blogFilters');
    if (!filtersContainer || !articles || !articles.length) return;

    // Extract unique categories
    const categoryMap = {};
    articles.forEach(function(a) {
        if (a.category && !categoryMap[a.category]) {
            categoryMap[a.category] = true;
        }
    });
    const categories = Object.keys(categoryMap).sort();

    // Build filter buttons with safe DOM methods
    filtersContainer.innerHTML = '';
    filtersContainer.setAttribute('role', 'group');
    filtersContainer.setAttribute('aria-label', t('blog.filters', 'Lọc theo danh mục'));

    const allBtn = document.createElement('button');
    allBtn.className = 'blog-filter-btn active';
    allBtn.setAttribute('data-category', 'all');
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.textContent = t('blog.all', 'Tất cả');
    filtersContainer.appendChild(allBtn);

    categories.forEach(function(cat) {
        const btn = document.createElement('button');
        btn.className = 'blog-filter-btn';
        btn.setAttribute('data-category', cat);
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = cat;
        filtersContainer.appendChild(btn);
    });

    // Add click handlers — nút chỉ ghi lại lựa chọn rồi để apDungLoc() quyết
    // định card nào hiện. KHÔNG tự bật/tắt .hidden ở đây: làm vậy là xoá mất
    // từ khoá khách đang gõ (xem chú thích ở LOC_HIEN_TAI).
    const buttons = filtersContainer.querySelectorAll('.blog-filter-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            buttons.forEach(function(b) {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            LOC_HIEN_TAI.danhMuc = btn.getAttribute('data-category');
            apDungLoc(true);
            ghiURL();
        });
    });
}

/* injectBlogSchema() — GỠ 12/09/2026. Đừng dựng lại.

   Hàm này chèn một node BlogPosting cho MỖI bài hiển thị trên blog.html (18 node).
   Nghe thì hợp lý, nhưng mỗi bài vốn đã có BlogPosting đầy đủ ngay trên trang bài
   của nó — nơi Google thật sự cần — nên đây là mô tả thứ hai cho cùng một thực thể,
   mà bản này lại sai ở bốn chỗ:

     · không có @id, nên nó KHÔNG nối vào bài thật mà đẻ ra thực thể mới;
     · logo khai favicon-180 trong khi nguồn chuẩn là favicon-512;
     · author/publisher khai "@type": "Organization" cho @id #restaurant, mà thực
       thể đó là Restaurant — sai kiểu cho cùng một @id;
     · dateModified luôn bằng ngày đăng, trong khi bài thật có ngày sửa riêng.

   Thêm nữa nó chỉ tồn tại sau khi JS chạy: GPTBot/ClaudeBot/PerplexityBot không
   chạy JS nên chẳng bao giờ thấy, còn Google thì thấy hai bản đánh nhau.

   Trang danh sách đã có CollectionPage + Blog (@id blog.html#blog) mô tả đúng bản
   chất của nó. Muốn liệt kê bài thì nối bằng @id vào node Blog tĩnh, đừng nhân bản
   BlogPosting ở đây. */

/* ===== Lọc bài viết: MỘT nguồn sự thật cho cả ô tìm kiếm lẫn nút danh mục =====
   Trước 08/09/2026 đây là hai hàm rời nhau, mỗi hàm tự bật/tắt class .hidden
   trên toàn bộ card mà không biết hàm kia vừa làm gì. Khách gãy thật thế này:
   bấm lọc "English" → còn bài tiếng Anh; gõ tiếp vào ô tìm kiếm → search chạy
   lại trên cả 141 card, kéo bài tiếng Việt hiện lại, trong khi nút "English"
   vẫn sáng vàng. Nay hai chỗ chỉ ghi vào LOC_HIEN_TAI rồi gọi apDungLoc(),
   nơi duy nhất quyết định card nào hiện. */
/* tuKhoa để SO KHỚP (đã hạ chữ thường), tuKhoaHienThi giữ nguyên văn khách gõ
   để còn ghi vào URL và trả lại đúng vào ô tìm kiếm lúc khôi phục. */
const LOC_HIEN_TAI = { danhMuc: 'all', tuKhoa: '', tuKhoaHienThi: '' };

/* ---- Trạng thái lọc ghi vào URL ----
   Kịch bản có thật: khách lọc "English", bấm vào một bài, đọc xong bấm Back —
   trước 08/09/2026 blog.html tải lại từ đầu và bộ lọc reset về "Tất cả", khách
   mất chỗ đang xem giữa 141 bài. Nay trạng thái nằm trong URL nên Back trả lại
   đúng thứ họ đang xem, và link đã lọc cũng gửi cho người khác được.

   Dùng replaceState chứ KHÔNG pushState: bấm 5 lần đổi danh mục mà đẻ 5 entry
   thì khách phải bấm Back 5 lần mới rời được trang. replaceState vẫn đủ cho
   kịch bản trên, vì rời sang bài viết là trình duyệt tự tạo entry mới.
   canonical của blog.html cố định nên query param không đẻ trang trùng lặp. */
const THAM_SO_DANH_MUC = 'danh-muc';
const THAM_SO_TIM = 'tim';
let hanGhiURL = null;

function ghiURL() {
    if (typeof history === 'undefined' || !history.replaceState) return;
    try {
        const p = new URLSearchParams();
        if (LOC_HIEN_TAI.danhMuc !== 'all') p.set(THAM_SO_DANH_MUC, LOC_HIEN_TAI.danhMuc);
        if (LOC_HIEN_TAI.tuKhoaHienThi) p.set(THAM_SO_TIM, LOC_HIEN_TAI.tuKhoaHienThi);
        const chuoi = p.toString();
        history.replaceState(null, '', location.pathname + (chuoi ? '?' + chuoi : '') + location.hash);
    } catch (e) { /* trình duyệt chặn history thì thôi, lọc vẫn chạy */ }
}

// Gõ phím thì hoãn lại rồi mới ghi: Safari giới hạn số lần gọi history trong
// một khoảng thời gian, gõ cả câu mà ghi từng ký tự là chạm trần.
function henGhiURL() {
    if (hanGhiURL) clearTimeout(hanGhiURL);
    hanGhiURL = setTimeout(ghiURL, 300);
}

function docURL() {
    try {
        const p = new URLSearchParams(location.search);
        LOC_HIEN_TAI.danhMuc = p.get(THAM_SO_DANH_MUC) || 'all';
        LOC_HIEN_TAI.tuKhoaHienThi = p.get(THAM_SO_TIM) || '';
        LOC_HIEN_TAI.tuKhoa = LOC_HIEN_TAI.tuKhoaHienThi.toLowerCase().trim();
    } catch (e) { /* URL lạ thì giữ mặc định */ }
}

/* Kéo giao diện về khớp LOC_HIEN_TAI. Chỉ gọi khi trạng thái đến TỪ NGOÀI
   (mở trang có sẵn query, hoặc bấm Back) — đừng gọi trong lúc khách đang gõ,
   vì ghi ngược vào ô tìm kiếm sẽ nhảy con trỏ. */
function dongBoGiaoDien() {
    const searchInput = document.getElementById('blogSearch');
    if (searchInput && searchInput.value !== LOC_HIEN_TAI.tuKhoaHienThi) {
        searchInput.value = LOC_HIEN_TAI.tuKhoaHienThi;
    }
    document.querySelectorAll('.blog-filter-btn').forEach(function(b) {
        const khop = b.getAttribute('data-category') === LOC_HIEN_TAI.danhMuc;
        b.classList.toggle('active', khop);
        b.setAttribute('aria-pressed', khop ? 'true' : 'false');
    });
}

function khoiPhucTuURL() {
    docURL();
    dongBoGiaoDien();
    apDungLoc(false);
}

function apDungLoc(coHieuUng) {
    const cards = document.querySelectorAll('.blog-card');
    const tuKhoa = LOC_HIEN_TAI.tuKhoa;
    const danhMuc = LOC_HIEN_TAI.danhMuc;
    let soHien = 0;

    cards.forEach(function(card) {
        const elCat = card.querySelector('.blog-category');
        const catGoc = elCat ? elCat.textContent.trim() : '';

        // Danh mục so khớp nguyên văn (đúng như data-category của nút),
        // còn từ khoá thì so chữ thường cho khách gõ thoải mái.
        const hopDanhMuc = danhMuc === 'all' || catGoc === danhMuc;

        let hopTuKhoa = true;
        if (tuKhoa) {
            const h2 = card.querySelector('h2');
            const p = card.querySelector('p');
            const title = h2 ? h2.textContent.toLowerCase() : '';
            const excerpt = p ? p.textContent.toLowerCase() : '';
            hopTuKhoa = title.indexOf(tuKhoa) !== -1 ||
                        excerpt.indexOf(tuKhoa) !== -1 ||
                        catGoc.toLowerCase().indexOf(tuKhoa) !== -1;
        }

        const hien = hopDanhMuc && hopTuKhoa;
        card.classList.toggle('hidden', !hien);

        if (hien) {
            soHien++;
            // Hiệu ứng mờ-dần chỉ chạy khi bấm đổi danh mục. Chạy nó theo từng
            // ký tự khách gõ thì cả lưới nhấp nháy, rất khó chịu.
            if (coHieuUng) {
                card.style.opacity = '0';
                setTimeout(function() { card.style.opacity = '1'; }, 50);
            }
        }
    });

    capNhatKhoiRong(soHien);
}

/* Khối "không tìm thấy". Thiếu nó thì gõ một từ vu vơ là 141 card biến sạch,
   để lại khoảng trắng không lời giải thích — khách không biết mình gõ hụt hay
   web hỏng, mà cũng chẳng thấy đường nào quay ra. */
function layKhoiRong() {
    let el = document.getElementById('blogEmpty');
    if (el) return el;

    const grid = document.querySelector('.blog-grid');
    if (!grid || !grid.parentNode) return null;

    el = document.createElement('div');
    el.id = 'blogEmpty';
    el.className = 'blog-empty';
    el.hidden = true;
    // role=status + aria-live: khách dùng screen reader được đọc kết quả rỗng,
    // thay vì im lặng tưởng trang chưa phản hồi.
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    // data-i18n là BẮT BUỘC ở đây, không phải trang trí: t() chỉ chạy đúng MỘT
    // lần lúc dựng khối. Khách search (dựng khối tiếng Việt) rồi mới bấm nút
    // EN thì applyTranslations() chỉ ghi lại các phần tử [data-i18n] — thiếu
    // thuộc tính này là khối đứng nguyên tiếng Việt giữa trang tiếng Anh.
    const tieuDe = document.createElement('p');
    tieuDe.className = 'blog-empty-title';
    tieuDe.setAttribute('data-i18n', 'blog.empty.title');
    tieuDe.textContent = t('blog.empty.title', 'Không tìm thấy bài viết nào');
    el.appendChild(tieuDe);

    const moTa = document.createElement('p');
    moTa.className = 'blog-empty-desc';
    moTa.setAttribute('data-i18n', 'blog.empty.desc');
    moTa.textContent = t('blog.empty.desc', 'Thử từ khoá ngắn hơn, hoặc xoá bộ lọc để xem lại toàn bộ bài viết.');
    el.appendChild(moTa);

    // Gắn listener lên chính nút, không lên phần tử con: applyTranslations ghi
    // innerHTML của nút chứ không thay nút, nên listener sống sót khi đổi ngôn ngữ.
    const nut = document.createElement('button');
    nut.type = 'button';
    nut.className = 'blog-empty-reset';
    nut.setAttribute('data-i18n', 'blog.empty.reset');
    nut.textContent = t('blog.empty.reset', 'Xoá bộ lọc');
    nut.addEventListener('click', xoaLoc);
    el.appendChild(nut);

    grid.parentNode.insertBefore(el, grid.nextSibling);
    return el;
}

function capNhatKhoiRong(soHien) {
    const el = layKhoiRong();
    if (el) el.hidden = soHien !== 0;
}

function xoaLoc() {
    LOC_HIEN_TAI.danhMuc = 'all';
    LOC_HIEN_TAI.tuKhoa = '';
    LOC_HIEN_TAI.tuKhoaHienThi = '';

    dongBoGiaoDien();
    apDungLoc(true);
    ghiURL();

    const searchInput = document.getElementById('blogSearch');
    if (searchInput) searchInput.focus();
}

function initBlogSearch() {
    const searchInput = document.getElementById('blogSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        LOC_HIEN_TAI.tuKhoaHienThi = this.value;
        LOC_HIEN_TAI.tuKhoa = this.value.toLowerCase().trim();
        apDungLoc(false);
        henGhiURL();
    });

    // Back/Forward giữa các trạng thái lọc, và cả lúc trang trở lại từ bfcache.
    window.addEventListener('popstate', function() {
        khoiPhucTuURL();
    });
}

function initBlogShare() {
    document.querySelectorAll('.blog-card').forEach(function(card) {
        const id = card.id;
        const url = 'https://tramdungchill.vn/blog/' + encodeURIComponent(id) + '.html';

        const shareDiv = document.createElement('div');
        shareDiv.className = 'blog-share';

        // Label
        const label = document.createElement('span');
        label.className = 'blog-share-label';
        label.textContent = t('blog.share', 'Chia sẻ:');
        shareDiv.appendChild(label);

        // Facebook share
        const fbLink = document.createElement('a');
        fbLink.className = 'blog-share-btn blog-share-fb';
        fbLink.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
        fbLink.target = '_blank';
        fbLink.rel = 'noopener';
        fbLink.setAttribute('aria-label', 'Facebook');
        fbLink.title = 'Facebook';
        fbLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
        shareDiv.appendChild(fbLink);

        // Zalo share
        const zaloLink = document.createElement('a');
        zaloLink.className = 'blog-share-btn blog-share-zalo';
        zaloLink.href = 'https://zalo.me/share?url=' + encodeURIComponent(url);
        zaloLink.target = '_blank';
        zaloLink.rel = 'noopener';
        zaloLink.setAttribute('aria-label', 'Zalo');
        zaloLink.title = 'Zalo';
        zaloLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2l3.5-5H10V9h4v2.5l-3.5 5zm6 0h-2l3.5-5H16V9h4v2.5l-3.5 5z"/></svg>';
        shareDiv.appendChild(zaloLink);

        // Copy link button (safe event listener, no inline onclick)
        const copyBtn = document.createElement('button');
        copyBtn.className = 'blog-share-btn blog-share-copy';
        copyBtn.setAttribute('aria-label', 'Copy link');
        copyBtn.title = t('blog.copylink', 'Sao chép link');
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener('click', function() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function() {
                    copyBtn.classList.add('copied');
                    setTimeout(function() { copyBtn.classList.remove('copied'); }, 2000);
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    copyBtn.classList.add('copied');
                    setTimeout(function() { copyBtn.classList.remove('copied'); }, 2000);
                } catch (e) { /* silently fail */ }
                document.body.removeChild(textarea);
            }
        });
        shareDiv.appendChild(copyBtn);

        const readMore = card.querySelector('.blog-read-more');
        if (readMore) {
            readMore.parentNode.insertBefore(shareDiv, readMore);
        }
    });
}
