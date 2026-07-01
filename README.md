# Mani Portfolio v2

A small static academic portfolio inspired by simple personal mathematics websites. It uses plain HTML, CSS, JavaScript, and Markdown files. There is no framework and no build step.

## Pages

- `index.html` — Home, including the previous About content.
- `pages/research.html` — Research page loaded from `content/research.md`.
- `pages/projects.html` — Projects page loaded from `content/projects.md`.
- `pages/blog.html` — Blog index with tags and search.
- `pages/misc.html` — Miscellaneous page loaded from `content/misc.md`.

There is no CV page.

## Run locally

From the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not open `index.html` directly from the filesystem, because browsers usually block `fetch()` access to local Markdown files. Use the local server above.

## Add or edit normal pages

Edit the Markdown files in `content/`:

```text
content/home.md
content/research.md
content/projects.md
content/misc.md
```

## Add a blog post

1. Create a Markdown file inside `content/posts/`, for example:

```text
content/posts/my-new-post.md
```

2. Add frontmatter:

```markdown
---
title: My New Post
date: 2026-07-01
tags: ["Mathematics", "Representation Theory"]
summary: Optional short summary shown on the blog page.
---

Your post starts here.
```

3. Add the filename to `content/posts.json`:

```json
[
  "my-new-post.md"
]
```

Or, if you have Node installed, run:

```bash
npm run index-posts
```

## Blog search and tags

The blog page searches over:

- post title
- tags
- date
- summary
- body text

Tags come from each post's Markdown frontmatter.

## LaTeX support

All Markdown-rendered pages support inline and display mathematics through KaTeX.

```markdown
Inline: $G = C_n \times C_n$.

Display:

$$
\operatorname{Sym}^k(V) = V^{\otimes k}/S_k.
$$
```

KaTeX is loaded from a CDN. That keeps the site light, but it means mathematics rendering needs an internet connection unless you vendor KaTeX locally.

## TikZ support

TikZ blocks are supported in Markdown posts/pages using TikZJax:

````markdown
```tikz
\begin{tikzpicture}
  \draw[->] (0,0) -- (2,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,2) node[above] {$y$};
\end{tikzpicture}
```
````

TikZJax is heavier than KaTeX and is loaded only when a TikZ block exists on the page. It requires an internet connection unless you vendor TikZJax locally.

For maximum reliability, especially on GitHub/Vercel, pre-render complex TikZ diagrams as SVG or PNG and include them as images.

## Images in Markdown

Put images in `assets/images/`, then link them from Markdown.

From a normal content page:

```markdown
![Description](../assets/images/my-image.png)
```

From a blog post:

```markdown
![Description](../../assets/images/my-image.png)
```

## Change fonts

All font settings are centralised at the top of `assets/style.css`:

```css
:root {
  --body-font: Georgia, "Times New Roman", Times, serif;
  --heading-font: Georgia, "Times New Roman", Times, serif;
  --mono-font: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  --math-font: KaTeX_Main, "Latin Modern Math", "STIX Two Math", serif;
}
```

Good mathematics-friendly choices include:

- Georgia with KaTeX for maths
- Times New Roman with KaTeX for maths
- Latin Modern Roman with Latin Modern Math, if you self-host the fonts
- STIX Two Text with STIX Two Math, if you self-host the fonts

Do not upload commercial font files unless you have the right licence.

## Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

You can then enable GitHub Pages from the repository settings if desired.

## Deploy to Vercel

1. Push the folder to GitHub.
2. Import the repository into Vercel.
3. Use the default static deployment settings.
4. No build command is required.

## Notes

This site intentionally stays simple: plain links, narrow text column, minimal CSS, Markdown content, and a small amount of JavaScript for rendering and search.
