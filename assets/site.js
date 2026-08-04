const SITE = {
  mathDelimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],

  socialLinks: {
  linkedin: 'https://www.linkedin.com/in/manishayestehfar',
  github: 'https://github.com/ManiShayestehfar',
  x: 'https://x.com/manishayes81079',
  mastodon: 'https://mathstodon.xyz/@ManiShayestehfar'
  },

  lastUpdated: '31 July 2026'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setYear() {
  document.querySelectorAll('#year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, body: text };

  const data = {};

  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf(':');
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    data[key] = value;
  }

  return { data, body: text.slice(match[0].length) };
}

function protectMath(markdown) {
  const blocks = [];
  const inline = [];

  let text = markdown.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    blocks.push(match);
    return `@@MATH_BLOCK_${blocks.length - 1}@@`;
  });

  text = text.replace(/(^|[^\\])\$((?:[^$\n\\]|\\.)+?)\$/g, (_match, prefix, content) => {
    inline.push(`$${content}$`);
    return `${prefix}@@MATH_INLINE_${inline.length - 1}@@`;
  });

  return { text, blocks, inline };
}

function restoreMath(html, blocks, inline) {
  let output = html;

  blocks.forEach((value, index) => {
    const token = `@@MATH_BLOCK_${index}@@`;
    output = output.replace(`<p>${token}</p>`, `<div class="math-display">${value}</div>`);
    output = output.replace(token, `<div class="math-display">${value}</div>`);
  });

  inline.forEach((value, index) => {
    output = output.replace(`@@MATH_INLINE_${index}@@`, value);
  });

  return output;
}

function renderMarkdown(markdown) {
  if (!window.marked || !window.DOMPurify) {
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }

  const { text, blocks, inline } = protectMath(markdown);
  const tikzBlocks = [];

  const withTikzTokens = text.replace(/```tikz\s*\n([\s\S]*?)```/g, (_match, code) => {
    tikzBlocks.push(code.trim());
    return `@@TIKZ_${tikzBlocks.length - 1}@@`;
  });

  marked.setOptions({
    gfm: true,
    breaks: false
  });

  let html = marked.parse(withTikzTokens);

  tikzBlocks.forEach((code, index) => {
    const escaped = escapeHtml(code);
    const tikzHtml = `<div class="tikz-wrapper"><script type="text/tikz">${escaped}</script></div>`;

    html = html.replace(`<p>@@TIKZ_${index}@@</p>`, tikzHtml);
    html = html.replace(`@@TIKZ_${index}@@`, tikzHtml);
  });

  html = restoreMath(html, blocks, inline);

  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['script', 'iframe'],
    ADD_ATTR: [
      'type',
      'class',
      'id',
      'src',
      'href',
      'target',
      'rel',
      'width',
      'height',
      'title',
      'loading',
      'style'
    ]
  });
}

function renderMath() {
  if (!window.renderMathInElement) return;

  document.querySelectorAll('.math-container').forEach((el) => {
    window.renderMathInElement(el, {
      delimiters: SITE.mathDelimiters,
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    });
  });
}

function renderTikzIfNeeded() {
  if (!document.querySelector('script[type="text/tikz"]')) return;
  if (document.querySelector('script[src*="tikzjax"]')) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/tikzjax@0.1.25/dist/tikzjax.js';
  script.async = true;
  document.body.appendChild(script);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

async function loadMarkdownPage() {
  const content = document.getElementById('content');
  const body = document.body;
  const postName = new URLSearchParams(window.location.search).get('post');
  const isPostPage = body.dataset.page === 'post';

  if (!content) return;

  if (isPostPage && !postName) {
    content.innerHTML = '<p>No post was selected. Please return to the <a href="blog.html">blog index</a>.</p>';
    return;
  }

  const markdownPath = postName
    ? `../content/posts/${encodeURIComponent(postName)}`
    : body.dataset.markdown;

  if (!markdownPath) return;

  try {
    const response = await fetch(markdownPath);
    if (!response.ok) throw new Error(`Could not load ${markdownPath}`);

    const markdown = await response.text();
    const { data, body: markdownBody } = parseFrontmatter(markdown);

    const meta = [];

    if (data.date) {
      meta.push(`<time datetime="${escapeHtml(data.date)}">${formatDate(data.date)}</time>`);
    }

    if (Array.isArray(data.tags) && data.tags.length) {
      meta.push(
        `<span>${data.tags
          .map((tag) => `<a class="tag" href="blog.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`)
          .join(' ')}</span>`
      );
    }

    content.innerHTML =
      `${meta.length ? `<p class="post-meta">${meta.join(' · ')}</p>` : ''}` +
      renderMarkdown(markdownBody);

    if (data.title && isPostPage) {
      document.title = `${data.title} — Mani Shayestehfar`;
    }

    renderMath();
    renderTikzIfNeeded();
  } catch (error) {
    content.innerHTML =
      '<p>Could not load this page. Run the site through a local server, for example <code>python -m http.server 8000</code>.</p>';
    console.error(error);
  }
}

function publicationCard(paper) {
  const safeDate = escapeHtml(paper.date || '');

  const links = [
    paper.pdf
      ? `<a href="${escapeHtml(paper.pdf)}" target="_blank" rel="noopener">PDF</a>`
      : '',
    paper.code
      ? `<a href="${escapeHtml(paper.code)}" target="_blank" rel="noopener">Code</a>`
      : '',
    paper.doi
      ? `<a href="${escapeHtml(paper.doi)}" target="_blank" rel="noopener">DOI</a>`
      : ''
  ]
    .filter(Boolean)
    .join('');

  return `
    <article class="paper-card">
      <h3>${escapeHtml(paper.title || 'Untitled paper')}</h3>

      <div class="paper-meta">
        ${paper.authors
          ? `<span class="paper-authors">${escapeHtml(paper.authors)}</span>`
          : ''
        }

        ${paper.date
          ? `
            <time class="paper-date" datetime="${safeDate}">
              ${escapeHtml(formatDate(paper.date))}
            </time>
          `
          : ''
        }

        ${links
          ? `<span class="paper-links">${links}</span>`
          : ''
        }

        ${paper.summary
          ? `
            <details class="paper-summary-dropdown">
              <summary>Summary</summary>

              <div class="paper-summary">
                ${renderMarkdown(paper.summary)}
              </div>
            </details>
          `
          : ''
        }
      </div>
    </article>
  `;
}

async function loadPublications() {
  const container = document.getElementById('publications-list');
  if (!container) return;

  try {
    const indexResponse = await fetch('../content/publications/index.json');
    if (!indexResponse.ok) throw new Error('Could not load publications index.');

    const files = await indexResponse.json();
    if (!Array.isArray(files)) throw new Error('Publications index must be an array.');

    const papers = await Promise.all(
      files.map(async (file) => {
        const response = await fetch(`../content/publications/${encodeURIComponent(file)}`);
        if (!response.ok) throw new Error(`Could not load ${file}`);

        const markdown = await response.text();
        const { data, body } = parseFrontmatter(markdown);

        return {
          ...data,
          summary: body.trim()
        };
      })
    );

    papers.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const published = papers.filter((paper) => paper.status === 'published');
    const drafts = papers.filter((paper) => paper.status !== 'published');

    container.innerHTML = `
      <h2>Published Papers</h2>
      ${published.length ? published.map(publicationCard).join('') : '<p>No published papers yet.</p>'}

      <h2>Drafts</h2>
      ${drafts.length ? drafts.map(publicationCard).join('') : '<p>No drafts yet.</p>'}
    `;

    renderMath();
  } catch (error) {
    container.innerHTML = '<p>Could not load publications.</p>';
    console.error(error);
  }
}

function addSiteFooter() {
  if (document.querySelector('.site-footer')) return;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';

  footer.innerHTML = `
      <div class="footer-socials" aria-label="Social media links">
    <a
      class="footer-social-link"
      href="${escapeHtml(SITE.socialLinks.linkedin)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
      title="LinkedIn"
    >
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.1 20.45H3.54V8.98H7.1v11.47Z"
        />
      </svg>
    </a>

    <span class="footer-dot" aria-hidden="true">•</span>

    <a
      class="footer-social-link"
      href="${escapeHtml(SITE.socialLinks.github)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
      title="GitHub"
    >
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.11-.75.41-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.23c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"
        />
      </svg>
    </a>

    <span class="footer-dot" aria-hidden="true">•</span>

    <a
      class="footer-social-link"
      href="${escapeHtml(SITE.socialLinks.x)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="X"
      title="X"
    >
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.24 2H21.9l-7.99 9.13L23.3 22h-7.35l-5.76-7.53L3.6 22H-.06l8.53-9.75L-.54 2h7.54l5.2 6.87L18.24 2Zm-1.28 18.08h2.03L5.9 3.82H3.72l13.24 16.26Z"
        />
      </svg>
    </a>

    <span class="footer-dot" aria-hidden="true">•</span>

    <a
      class="footer-social-link"
      href="${escapeHtml(SITE.socialLinks.mastodon)}"
      target="_blank"
      rel="noopener noreferrer me"
      aria-label="Mastodon"
      title="Mastodon"
    >
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M21.58 7.19c0-4.16-2.72-5.38-2.72-5.38C17.49 1.18 15.13.91 12.03.9h-.08c-3.1.01-5.46.28-6.83.91 0 0-2.72 1.22-2.72 5.38 0 .95-.02 2.08.01 3.28.12 4.07.75 8.08 4.51 9.08 1.74.46 3.24.56 4.45.49 2.2-.13 3.43-.78 3.43-.78l-.07-1.59s-1.57.49-3.33.43c-1.74-.06-3.58-.19-3.86-2.35a4.48 4.48 0 0 1-.04-.61s1.71.42 3.88.52c1.33.06 2.57-.08 3.84-.23 2.43-.29 4.55-1.79 4.82-3.16.43-2.15.39-5.25.39-5.25Zm-3.45 5.41h-2.14V7.36c0-1.1-.46-1.66-1.39-1.66-1.03 0-1.55.67-1.55 2v2.87h-2.13V7.7c0-1.33-.52-2-1.55-2-.93 0-1.39.56-1.39 1.66v5.24H5.84V7.2c0-1.1.28-1.98.84-2.63.58-.65 1.34-.98 2.29-.98 1.1 0 1.94.42 2.49 1.25L12 5.75l.54-.91c.56-.83 1.39-1.25 2.49-1.25.95 0 1.71.33 2.29.98.55.65.83 1.53.83 2.63v5.4Z"
        />
      </svg>
    </a>
  </div>

    <div class="footer-copyright">
      <span>© Mani Shayestehfar</span>
      <span class="footer-update">
        Updated ${escapeHtml(SITE.lastUpdated)}
      </span>
    </div>
  `;

  document.body.appendChild(footer);
}

setYear();
addSiteFooter();
loadMarkdownPage().then(loadPublications);
