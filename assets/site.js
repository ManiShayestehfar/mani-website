const SITE = {
  mathDelimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ]
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
  const safeStatus = escapeHtml(paper.status || 'paper');
  const safeDate = escapeHtml(paper.date || '');
  const year = paper.date ? new Date(paper.date).getFullYear() : '';
  const links = [
    paper.pdf ? `<a href="${escapeHtml(paper.pdf)}" target="_blank" rel="noopener">PDF</a>` : '',
    paper.code ? `<a href="${escapeHtml(paper.code)}" target="_blank" rel="noopener">Code</a>` : '',
    paper.doi ? `<a href="${escapeHtml(paper.doi)}" target="_blank" rel="noopener">DOI</a>` : ''
  ]
    .filter(Boolean)
    .join('');

  return `
    <div class="paper-card ${safeStatus}">
      <div class="paper-top">
        <span class="paper-label">${safeStatus}</span>
        <span class="paper-year"><time datetime="${safeDate}">${Number.isNaN(year) ? '' : year}</time></span>
      </div>

      <h3>${escapeHtml(paper.title || 'Untitled paper')}</h3>

      ${paper.authors ? `<p class="paper-authors">${escapeHtml(paper.authors)}</p>` : ''}
      ${paper.venue ? `<p class="paper-venue">${escapeHtml(paper.venue)}</p>` : ''}

      ${paper.summary ? `<div class="paper-summary">${renderMarkdown(paper.summary)}</div>` : ''}

      ${links ? `<div class="paper-links">${links}</div>` : ''}
    </div>
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

setYear();
loadMarkdownPage().then(loadPublications);
