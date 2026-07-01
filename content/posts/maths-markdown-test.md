---
title: Maths Markdown Test
date: 2026-07-01
tags: ["Mathematics", "LaTeX", "TikZ"]
summary: A small test post showing LaTeX, TikZ, and images inside Markdown.
---

This post is a template for mathematical writing.

Inline mathematics: $\rho: G \to \operatorname{GL}(V)$.

Display mathematics:

$$
\chi_{\operatorname{Sym}^k(V)}(g)
= [t^k]\prod_{i=1}^n \frac{1}{1-\lambda_i(g)t}.
$$

You can attach images using normal Markdown syntax:

![Profile placeholder](../../assets/images/profile.jpeg)

You can also write TikZ in a fenced block. This needs an internet connection because TikZJax is loaded from a CDN.

```tikz
\begin{tikzpicture}
  \draw[->] (0,0) -- (3,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,2) node[above] {$y$};
  \draw (0.4,0.4) circle (0.35);
  \node at (1.8,1.2) {$G \curvearrowright X$};
\end{tikzpicture}
```
