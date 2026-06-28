/**
 * Rolin Bio Website - Main JavaScript
 * Handles: language toggle, navigation, news loading, contact form, animations
 */

/* ============================================
   1. Language Toggle
   ============================================ */
function toggleLang() {
  var html = document.documentElement;
  var current = html.getAttribute('data-lang');
  var next = current === 'en' ? 'zh' : 'en';
  html.setAttribute('data-lang', next);
  localStorage.setItem('rolinbio-lang', next);
  updateLangSwitch();
}

function updateLangSwitch() {
  var current = document.documentElement.getAttribute('data-lang');
  var spans = document.querySelectorAll('#langSwitch span');
  spans.forEach(function(span) {
    var langAttr = span.getAttribute('data-lang-en') !== null ? 'en' : 'zh';
    if (langAttr === current) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
}

// Restore saved language preference
(function() {
  var saved = localStorage.getItem('rolinbio-lang');
  if (saved === 'zh' || saved === 'en') {
    document.documentElement.setAttribute('data-lang', saved);
  }
  updateLangSwitch();
})();

/* ============================================
   2. Navigation
   ============================================ */
var navbar = document.getElementById('navbar');
var mobileToggle = document.getElementById('mobileToggle');
var navLinks = document.getElementById('navLinks');

// Scroll effect
window.addEventListener('scroll', function() {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Trigger on load
if (window.scrollY > 50) navbar.classList.add('scrolled');

// Mobile menu
function toggleMobile() {
  navLinks.classList.toggle('open');
}

// Close mobile menu on link click
document.querySelectorAll('#navLinks a').forEach(function(link) {
  link.addEventListener('click', function() {
    navLinks.classList.remove('open');
  });
});

/* ============================================
   3. News Loading (from Markdown files)
   ============================================ */
(function loadNews() {
  var newsList = document.getElementById('newsList');
  if (!newsList) return;

  var newsFiles = [];

  // Try to load the news index
  fetch('../content/news/')
    .then(function(res) { return res.text(); })
    .then(function(html) {
      // Parse directory listing for .md files
      var matches = html.match(/href="([^"]+\.md)"/g);
      if (matches) {
        matches.forEach(function(m) {
          var file = m.replace(/href="|"/g, '');
          newsFiles.push(file);
        });
      }
      // Fallback: hardcoded list
      if (newsFiles.length === 0) {
        newsFiles = [
          '2026-06-15-thailand-fda-accelerates-registration.md',
          '2026-06-08-sea-pharma-market-growth.md',
          '2026-05-28-vietnam-pharma-law-update.md'
        ];
      }
      fetchAllNews(newsFiles);
    })
    .catch(function() {
      // Fallback: use hardcoded list
      newsFiles = [
        '2026-06-15-thailand-fda-accelerates-registration.md',
        '2026-06-08-sea-pharma-market-growth.md',
        '2026-05-28-vietnam-pharma-law-update.md'
      ];
      fetchAllNews(newsFiles);
    });
})();

function fetchAllNews(files) {
  var promises = files.map(function(file) {
    return fetch('../content/news/' + file)
      .then(function(res) { return res.text(); })
      .then(function(text) { return parseMarkdownFrontmatter(text); })
      .catch(function() { return null; });
  });

  Promise.all(promises).then(function(articles) {
    articles = articles.filter(function(a) { return a !== null; });
    articles.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    renderNewsList(articles);
    renderHomeNews(articles);
  });
}

function parseMarkdownFrontmatter(text) {
  var article = {};
  var lines = text.split('\n');
  var inFrontmatter = false;
  var fmEnd = 0;

  if (lines[0] && lines[0].trim() === '---') {
    inFrontmatter = true;
    for (var i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        fmEnd = i;
        break;
      }
      var colonIdx = lines[i].indexOf(':');
      if (colonIdx > 0) {
        var key = lines[i].substring(0, colonIdx).trim();
        var value = lines[i].substring(colonIdx + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        article[key] = value;
      }
    }
    article.body = lines.slice(fmEnd + 1).join('\n').trim();
  }

  return article;
}

function renderNewsList(articles) {
  var newsList = document.getElementById('newsList');
  if (!newsList) return;

  var html = '';
  articles.forEach(function(article, idx) {
    var categoryLabels = {
      'market-access': 'Market Access',
      'regulatory': 'Regulatory Update',
      'trends': 'Industry Trends',
      'company': 'Company News',
      'case-study': 'Case Study'
    };
    html += '<div class="news-list-card fade-in-up" onclick="openNewsArticle(' + idx + ')" style="animation-delay:' + (idx * 0.1) + 's;">';
    html += '<div class="news-card-img">📰</div>';
    html += '<div class="news-card-body">';
    html += '<div class="news-card-date">' + formatDate(article.date) + ' &middot; ' + (categoryLabels[article.category] || article.category) + '</div>';
    html += '<h4>' + escapeHtml(article.title) + '</h4>';
    html += '<p>' + escapeHtml(article.excerpt || '') + '</p>';
    html += '</div></div>';
  });

  newsList.innerHTML = html;
  window._newsArticles = articles;
}

function renderHomeNews(articles) {
  var homeGrid = document.getElementById('newsGrid');
  if (!homeGrid) return;

  var top3 = articles.slice(0, 3);
  var html = '';
  top3.forEach(function(article) {
    html += '<a href="news/" class="news-card fade-in-up">';
    html += '<div class="news-card-img">📰</div>';
    html += '<div class="news-card-body">';
    html += '<div class="news-card-date">' + formatDate(article.date) + '</div>';
    html += '<h4>' + escapeHtml(article.title) + '</h4>';
    html += '<p>' + escapeHtml(article.excerpt || '') + '</p>';
    html += '</div></a>';
  });
  homeGrid.innerHTML = html;
}

function openNewsArticle(idx) {
  var article = window._newsArticles[idx];
  if (!article) return;

  var modal = document.getElementById('newsModal');
  document.getElementById('modalDate').textContent = formatDate(article.date);
  document.getElementById('modalTitle').textContent = article.title;
  document.getElementById('modalBody').innerHTML = renderMarkdownBody(article.body);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
  var modal = document.getElementById('newsModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Click outside to close
document.addEventListener('click', function(e) {
  var modal = document.getElementById('newsModal');
  if (e.target === modal) {
    closeNewsModal();
  }
});

// Escape key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeNewsModal();
  }
});

/* Simple Markdown-to-HTML renderer */
function renderMarkdownBody(md) {
  if (!md) return '';
  var html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Tables (simple conversion)
    .replace(/^\|(.+)\|$/gm, function(match) {
      return '<tr>' + match.replace(/^\||\|$/g, '').split('|').map(function(cell) {
        return '<td>' + cell.trim() + '</td>';
      }).join('') + '</tr>';
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to <br>
    .replace(/\n/g, '<br>');

  // Wrap list items
  html = html.replace(/(<li>.*?<\/li>)/gs, function(match) {
    return '<ul>' + match + '</ul>';
  });

  return '<p>' + html + '</p>';
}

/* ============================================
   4. Helper Functions
   ============================================ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================
   5. Contact Form
   ============================================ */
function handleContactSubmit(e) {
  e.preventDefault();
  var form = e.target;
  // In production, send to API endpoint or Netlify Forms
  console.log('Contact form submitted');

  // Show success message
  var lang = document.documentElement.getAttribute('data-lang');
  if (lang === 'zh') {
    document.getElementById('formSuccessZh').style.display = 'block';
  } else {
    document.getElementById('formSuccess').style.display = 'block';
  }
  form.querySelector('button[type="submit"]').disabled = true;
  form.reset();
  setTimeout(function() {
    document.getElementById('formSuccess').style.display = 'none';
    document.getElementById('formSuccessZh').style.display = 'none';
    form.querySelector('button[type="submit"]').disabled = false;
  }, 4000);
}

/* ============================================
   6. Counter Animation (Stats Section)
   ============================================ */
function animateCounters() {
  var counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length === 0) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-target'));
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 2000;
        var start = performance.now();

        function update(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var current = Math.floor(progress * target);
          el.textContent = current + suffix;
          if (progress < 1) {
            requestAnimationFrame(update);
          }
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function(c) { observer.observe(c); });
}

// Init counter animation on load
document.addEventListener('DOMContentLoaded', function() {
  animateCounters();
});

/* ============================================
   7. Smooth Scroll for Anchor Links
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
