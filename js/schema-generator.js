/* Schema Generator - Tram Dung Chill
   Generate JSON-LD tu data/schema-data.js */

function generateSchemas() {
    var page = detectCurrentPage();

    if (page === 'index') {
        injectSchema(buildRestaurantSchema());
        injectSchema(buildFaqSchema());
        injectSchema(buildReviewSchema());
    } else if (page === 'blog') {
        injectSchema(buildBlogSchema());
    } else if (page === 'menu') {
        injectSchema(buildMenuSchema());
    }
}

function injectSchema(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

function buildRestaurantSchema() {
    var r = SCHEMA_DATA.restaurant;
    return {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        'name': r.name,
        'alternateName': r.alternateName,
        'description': r.description,
        'image': r.images,
        'url': r.url,
        'telephone': r.telephone,
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': r.address.street,
            'addressLocality': r.address.locality,
            'addressRegion': r.address.region,
            'postalCode': r.address.postalCode,
            'addressCountry': r.address.country
        },
        'geo': {
            '@type': 'GeoCoordinates',
            'latitude': r.geo.latitude,
            'longitude': r.geo.longitude
        },
        'servesCuisine': r.cuisine,
        'openingHoursSpecification': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'opens': r.hours.open,
            'closes': r.hours.close
        },
        'priceRange': r.priceRange,
        'currenciesAccepted': r.currenciesAccepted,
        'paymentAccepted': r.paymentAccepted,
        'acceptsReservations': 'True',
        'hasMenu': {
            '@type': 'Menu',
            'name': 'Menu ' + r.name,
            'url': r.url + '/#menu'
        },
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': r.rating.value,
            'reviewCount': r.rating.count,
            'bestRating': r.rating.best
        },
        'amenityFeature': r.amenities.map(function(a) {
            return {
                '@type': 'LocationFeatureSpecification',
                'name': a.name,
                'value': a.value
            };
        }),
        'sameAs': r.sameAs
    };
}

function buildFaqSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': SCHEMA_DATA.faq.map(function(item) {
            return {
                '@type': 'Question',
                'name': item.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': item.answer
                }
            };
        })
    };
}

function buildReviewSchema() {
    var r = SCHEMA_DATA.restaurant;
    return {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        '@id': r.url + '/#restaurant',
        'name': r.name,
        'review': SCHEMA_DATA.reviews.map(function(rev) {
            return {
                '@type': 'Review',
                'reviewRating': {
                    '@type': 'Rating',
                    'ratingValue': rev.rating,
                    'bestRating': '5'
                },
                'author': {
                    '@type': 'Person',
                    'name': rev.author
                },
                'reviewBody': rev.body,
                'datePublished': rev.date
            };
        })
    };
}

function buildBlogSchema() {
    var r = SCHEMA_DATA.restaurant;
    var articles = (typeof BLOG_ARTICLES !== 'undefined') ? BLOG_ARTICLES : [];
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'Blog ' + r.name,
        'description': 'Chia sẻ trải nghiệm ăn nướng BBQ, du lịch Đà Lạt',
        'url': r.url + '/blog.html',
        'publisher': {
            '@type': 'Restaurant',
            'name': r.name,
            'url': r.url
        },
        'blogPost': articles.map(function(a) {
            return {
                '@type': 'BlogPosting',
                'headline': a.title,
                'description': a.excerpt.replace(/<[^>]*>/g, ''),
                'datePublished': a.date,
                'author': {
                    '@type': 'Organization',
                    'name': r.name
                },
                'image': r.url + '/' + a.image
            };
        })
    };
}

function buildMenuSchema() {
    var r = SCHEMA_DATA.restaurant;
    var sections = [];
    if (typeof MENU_CATEGORIES !== 'undefined' && typeof MENU_ITEMS !== 'undefined') {
        sections = MENU_CATEGORIES.map(function(cat) {
            var items = (MENU_ITEMS[cat.id] || []).map(function(item) {
                var menuItem = {
                    '@type': 'MenuItem',
                    'name': item.name,
                    'description': item.name + ' — ' + cat.label + ' tại Trạm Dừng Chill Đà Lạt'
                };
                if (/^\d/.test(item.price)) {
                    menuItem.offers = {
                        '@type': 'Offer',
                        'price': item.price.replace(/K$/i, '000'),
                        'priceCurrency': 'VND',
                        'availability': 'https://schema.org/InStock'
                    };
                }
                return menuItem;
            });
            return {
                '@type': 'MenuSection',
                'name': cat.label,
                'hasMenuItem': items
            };
        });
    }
    return {
        '@context': 'https://schema.org',
        '@type': 'Menu',
        'name': 'Thực Đơn ' + r.name,
        'description': 'Thực đơn quán nướng BBQ Đà Lạt — Nướng tại bàn, lẩu, hải sản, đồ uống. Giá cập nhật mới nhất.',
        'url': r.url + '/menu.html',
        'mainEntity': {
            '@type': 'Restaurant',
            'name': r.name,
            'url': r.url,
            'telephone': r.telephone,
            'address': {
                '@type': 'PostalAddress',
                'streetAddress': r.address.street,
                'addressLocality': r.address.locality,
                'addressRegion': r.address.region,
                'postalCode': r.address.postalCode,
                'addressCountry': r.address.country
            },
            'openingHoursSpecification': {
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                'opens': r.hours.open,
                'closes': r.hours.close
            },
            'servesCuisine': r.cuisine
        },
        'hasMenuSection': sections
    };
}
