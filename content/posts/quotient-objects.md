---
title: Quotient Objects
date: 2025-04-01
tags: ["Category Theory"]
---
# Quotient Objects

## Introduction

If you happen to have delved in the algebraic world of physics, or algebra in general, there's a good chance that you have heard of *quotient*-type objects. Quotient spaces, rings, groups, modules, and on and on... But what *really* are these objects, and what do they have in common with each other? I should mention that this text will not provide an in-depth understanding of the objects themselves (there are lots of good resources online + ChatGPT etc.), but rather it attempts to provide a vision to what *quotient-ing* those objects really means.

### Example - Projective Hilbert Space

In quantum mechanics, the state of a physical system is represented by a vector in a complex Hilbert space $\mathcal{H}$ (a complex vector space with an inner product). Recall (or kindly accept) that all observable predictions (i.e. probabilities, expectations, etc.) depend only on the *relative* phases and magnitudes of states, and not on an overall nonzero scalar. i.e. a global phase is physically unobservable. This essentially means that two vectors/states in $\mathcal{H}$  that differ by a nonzero complex scalar factor represent *equivalent* physical states. Mathematically we write this as an **equivalence relation**

$$
\ket{\psi} \:\sim\: \alpha\ket{\psi} \quad \textrm{for any}\:\:\alpha \in \mathbb{C}\backslash \{0\}.
$$

Hence we can write

$$
\ket{\psi_1} \:\sim\: \ket{\psi_2} \iff \ket{\psi_1} = \alpha \ket{\psi_2}.
$$

We can partition $\mathcal{H}\backslash\{0\}$ (from now on denoted just as $\mathcal{H}$) using its vectors such that for all $\ket{\psi} \in \mathcal{H}, \:\:[\:\ket{\psi}\:] = \{\ket{\varphi} \in \mathcal{H}\::\: \ket{\varphi} \sim \ket{\psi}\}$, where each $[ \cdot ]$ is called an **equivalence class**. These equivalence classes form a partition of $\mathcal{H}$, meaning that every state belongs to exactly one equivalence class. An intuitive way to think of this is to imagine sorting items in a basket based on a rule that groups ‘’similar’’ items together.

The set of all equivalence classes or is denoted as $H/\sim$. The **Projective Hilbert space** is the set of equivalence classes

$$
\mathbb{P}(\mathcal{H}) = \mathcal{H} / \sim
$$

where $\sim$ is defined the same way as eq. $(1)$. Intuitively, this means to ``collapse'' each entire line of states in $\mathcal{H}$ down to a single point in the projective space. i.e. we do not distinguish between $\ket{\psi}$'s and $\alpha\ket{\psi}$'s in this space. This is an example of **quotient space**.

## Quotient Construction

You may now guess that for each quotient object, one needs to concretely define an equivalence relation $\sim$. Here are how some of these objects are constructed:

### Groups $G$ and Rings $R$

A normal subgroup $N \trianglelefteq G$ induces an equivalence relation

$$
g_1 \sim g_2 \iff g_1g_2^{-1} \in N
$$

for $g_1,g_2 \in G$ The **quotient group** $G/N$ is then the set of cosets (subsets of the underlying set of $G$ that still preserve it's "group-ness") of $N$. 

To construct a **quotient ring**, the group  $G$ is replaced with ring $R$, and subgroup $N$ with an ideal $I$ such that

$$
a \sim b \iff a - b \in I
$$

### Modules $A$

A submodule $B \subseteq A$ induces

$$
a \sim b \iff a - b \in B
$$

for $a,b \in A$ and the **quotient module** is $A/B$.

### Topological Spaces $X$

Let $X$ be a topological space (a set where subsets can only exist according to `some' conditions) and $\sim$ be an equivalence relation on $X$. As before, the **quotient space** $X/\sim$ is the set of equivalence classes. Let $\pi: X \to X/\sim$ be a map from $x$ to its equivalence class $[x]$. The **quotient topology** on $X/\sim$ is defined by declaring a rule on subsets $U \subset X/\sim$ such that

$$
U\:\:\text{is open}\: \iff \pi^{-1}(U)\:\:\text{is open in}\:X.
$$

Intuitively a quotient space of $X$ is like transforming a space by “gluing together” points that share a certain relation, effectively treating them as a single point. Imagine drawing a line on a piece of paper and then taping its endpoints together to form a loop; the original line has been transformed by identifying the endpoints. In the quotient topology, a set is open if its pre-image in the original space was open, ensuring that the new space inherits a natural notion of open-ness from the old one.

### Generalisation

By now you may have noticed some similarities and differences between these quotient constructions, even though the objects themselves may be different. Very generally, 

> **a quotient is the *most general way* to force some substructure to behave like zero or a single point.**
> 

- In groups and modules, the normal subgroup/submodule gets collapsed to the identity element
- In rings, an ideal is collapsed to a zero
- In topological quotients, an entire subset is collapsed to a point

In order to see a more general picture of quotients, one requires some understanding of **Category Theory.** Category theory mainly aims to unify mathematical structures such as the aforementioned groups, topologies, etc. by focusing on the relationships (or morphisms) between the objects rather than the objects themselves. Generally a category $\mathfrak{C}$ consists of:

1. A collection of objects $x,y,z,...$
2. A collection of morphisms between pairs of objects; the `set' of morphisms is denoted as $\hom_\mathfrak{C}(x,y)$
3. A composition rule such that whenever the codomain of one morphism matches the domain of another, there is a morphism that is their composition. i.e if $x \overset{f}{\longrightarrow} y$ and $y \overset{g}{\longrightarrow} z$, then $x \overset{g \circ f}{\longrightarrow} z$.

Furthermore,

- Each object $x$ has an `identity morphism' $x \overset{\text{id}_x}{\longrightarrow} x$ which satisfies $\text{id}_y \circ f = f = f \circ \text{id}_x$ for any $x \overset{f}{\longrightarrow} y$.
- Each composition is `associative'. i.e. $(h \circ g)\circ f = h \circ (g \circ f)$ whenever $x \overset{f}{\longrightarrow} y \overset{g}{\longrightarrow} z \overset{h}{\longrightarrow} w$

In particular, a quotient object stems from a more general idea of **coequalisers** of morphisms or pairs of morphisms. Formally, given a category $\mathfrak{C}$, consider two parallel morphisms (distinct morphisms that share the same domain and codomain) $f,g: A \rightrightarrows B$. A coequaliser of $(f,g)$ is 

1.  An object $Q$ in $\mathfrak{C}$,
2. A morphism $q: B\to Q$

such that $q \circ f = q \circ g$, and the following **universal property** holds:

<div class="quiver-wrapper">
  <iframe
    class="quiver-embed"
    src="https://q.uiver.app/#q=WzAsNCxbMCwwLCJBIl0sWzIsMCwiQiJdLFszLDAsIlEiXSxbMywxLCJRJyJdLFswLDEsImciLDIseyJvZmZzZXQiOjJ9XSxbMCwxLCJmIiwwLHsib2Zmc2V0IjotMn1dLFsxLDJdLFsyLDMsIiIsMix7InN0eWxlIjp7ImJvZHkiOnsibmFtZSI6ImRhc2hlZCJ9fX1dLFsxLDNdXQ==&embed"
    width="560"
    height="304"
    title="Coequaliser diagram"
    loading="lazy">
  </iframe>
</div>

i.e. for any pair $(Q', q')$, there exists a unique morphism $u:Q \to Q'$ such that $u \circ q = q'$.

To relate this back to our idea of a quotient, the two parallel morphisms $f,g$ generate an equivalence relation on the objects of $B$. The coequaliser object $Q$ is then the “quotient'' of $B$ by that equivalence relation. Finally, the map
 $q: B \to Q$  is the “projection'' that sends elements of $B$ that must be identified to the *same point* in $Q$.

### Final Words

This is by no means a rigorous or complete description of category theory, and certainly not to group, ring, or representation theory. I hope that this excerpt has at least provided you with some motivation and introduction into these wonderful areas of mathematics! I partially used this blog resource for the definition of a category, and highly recommend the Youtube channel, VisualMath's category theory series for further insights.