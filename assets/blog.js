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

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~$\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function scorePost(post, query, activeTag) {
  if (activeTag && !post.tags.map((tag) => tag.toLowerCase()).includes(activeTag.toLowerCase())) return -1;
  if (!query) return 1;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;
  const title = post.title.toLowerCase();
  const tags = post.tags.join(' ').toLowerCase();
  const date = post.date.toLowerCase();
  const body = post.searchText.toLowerCase();

  for (const term of terms) {
    if (title.includes(term)) score += 8;
    if (tags.includes(term)) score += 5;
    if (date.includes(term)) score += 2;
    if (body.includes(term)) score += 1;
  }

  return score;
}

function postLink(filename) {
  return `post.html?post=${encodeURIComponent(filename)}`;
}

async function loadPosts() {
  const indexResponse = await fetch('../content/posts.json');
  if (!indexResponse.ok) throw new Error('Could not load posts index.');

  const files = await indexResponse.json();
  if (!Array.isArray(files)) throw new Error('Posts index must be an array.');

  const posts = await Promise.all(
    files.map(async (filename) => {
      const response = await fetch(`../content/posts/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error(`Could not load ${filename}`);

      const markdown = await response.text();
      const { data, body } = parseFrontmatter(markdown);
      const title = data.title || filename.replace(/\.md$/, '');
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const searchText = stripMarkdown(body);
      const summary = data.summary || searchText.slice(0, 180);

      return { filename, title, date: data.date || '', tags, summary, searchText };
    })
  );

  return posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function renderTags(posts, activeTag) {
  const tagCloud = document.getElementById('tag-cloud');
  if (!tagCloud) return;

  const counts = new Map();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }

  const allButton = `<button class="tag-button${!activeTag ? ' active' : ''}" data-tag="">All</button>`;
  const tagButtons = [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tag]) => `<button class="tag-button${activeTag === tag ? ' active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
    .join('');

  tagCloud.innerHTML = allButton + tagButtons;
}

function renderPosts(posts, query, activeTag) {
  const list = document.getElementById('post-list');
  const resultCount = document.getElementById('result-count');
  if (!list || !resultCount) return;

  const scored = posts
    .map((post) => ({ post, score: scorePost(post, query, activeTag) }))
    .filter((item) => item.score >= 0 && (!query || item.score > 0))
    .sort((a, b) => b.score - a.score || (b.post.date || '').localeCompare(a.post.date || ''));

  resultCount.textContent = `${scored.length} post${scored.length === 1 ? '' : 's'}${activeTag ? ` tagged ${activeTag}` : ''}${query ? ` matching “${query}”` : ''}.`;

  list.innerHTML = scored.map(({ post }) => `
    <li class="post-card">
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <div class="post-meta-line">
        ${post.date ? `<time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>` : ''}
        ${post.tags.length ? `<span class="meta-separator">·</span><span class="post-tags-inline">${post.tags.map((tag) => `<button class="tag-inline" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join(' ')}</span>` : ''}
        <span class="meta-separator">·</span><a class="read-link" href="${postLink(post.filename)}">read post</a>
      </div>
    </li>
  `).join('');
}

async function initBlog() {
  setYear();

  const search = document.getElementById('blog-search');
  const params = new URLSearchParams(window.location.search);
  let activeTag = params.get('tag') || '';
  let query = params.get('q') || '';

  if (search) search.value = query;

  try {
    const posts = await loadPosts();
    renderTags(posts, activeTag);
    renderPosts(posts, query, activeTag);

    search?.addEventListener('input', () => {
      query = search.value.trim();
      renderPosts(posts, query, activeTag);
    });

    document.getElementById('tag-cloud')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tag]');
      if (!button) return;
      activeTag = button.dataset.tag;
      renderTags(posts, activeTag);
      renderPosts(posts, query, activeTag);
    });

    document.getElementById('post-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tag]');
      if (!button) return;
      activeTag = button.dataset.tag;
      renderTags(posts, activeTag);
      renderPosts(posts, query, activeTag);
    });
  } catch (error) {
    const list = document.getElementById('post-list');
    if (list) {
      list.innerHTML = '<li>Could not load posts. Run the site through a local server, for example <code>python -m http.server 8000</code>.</li>';
    }
    console.error(error);
  }
}

initBlog();
