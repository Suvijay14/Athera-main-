/**
 * Feature 4d clustering without pgvector (Task 15 decision):
 * TF–IDF bag-of-words vectors + k-means (k=2,3) with cosine silhouette.
 * Reasonable stand-in for embeddings on short titles; defers semantic paraphrase to a later pgvector pass.
 */

export type TitleClusterInput = { id: string; title: string }

export type TitleClusterResult = {
  k: number
  assignments: Map<string, number>
  silhouette: number
  ambiguousShare: number
}

const MIN_CLUSTER_SIZE = 6
const MIN_SILHOUETTE = 0.35

function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function buildVocabulary(items: TitleClusterInput[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    for (const t of tokenize(item.title)) {
      set.add(t)
    }
  }
  return [...set].sort()
}

function tfidfVector(tokens: string[], vocab: string[], df: Map<string, number>, nDocs: number): number[] {
  const tf = new Map<string, number>()
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1)
  }
  return vocab.map((term) => {
    const termFreq = tf.get(term) ?? 0
    if (termFreq === 0) {
      return 0
    }
    const idf = Math.log((1 + nDocs) / (1 + (df.get(term) ?? 0))) + 1
    return (termFreq / tokens.length) * idf
  })
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  if (na === 0 || nb === 0) {
    return 0
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function kMeans(vectors: number[][], k: number, maxIter = 40): number[] {
  if (vectors.length < k) {
    return vectors.map((_, i) => i % k)
  }
  const centroids = vectors.slice(0, k).map((v) => [...v])
  const labels = vectors.map((_, i) => i % k)

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false
    for (let i = 0; i < vectors.length; i++) {
      let best = 0
      let bestSim = -Infinity
      for (let c = 0; c < k; c++) {
        const sim = cosine(vectors[i]!, centroids[c]!)
        if (sim > bestSim) {
          bestSim = sim
          best = c
        }
      }
      if (labels[i] !== best) {
        labels[i] = best
        changed = true
      }
    }
    if (!changed) {
      break
    }
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, i) => labels[i] === c)
      if (members.length === 0) {
        continue
      }
      const dim = vectors[0]!.length
      const next = new Array(dim).fill(0)
      for (const v of members) {
        for (let d = 0; d < dim; d++) {
          next[d] += v[d]!
        }
      }
      for (let d = 0; d < dim; d++) {
        next[d] /= members.length
      }
      centroids[c] = next
    }
  }
  return labels
}

function silhouetteScore(vectors: number[][], labels: number[], k: number): number {
  if (vectors.length < 2 || k < 2) {
    return 0
  }
  let total = 0
  let count = 0
  for (let i = 0; i < vectors.length; i++) {
    const own = labels[i]!
    const same = vectors.filter((_, j) => labels[j] === own && j !== i)
    if (same.length === 0) {
      continue
    }
    let a = 0
    for (const v of same) {
      a += 1 - cosine(vectors[i]!, v)
    }
    a /= same.length

    let b = Infinity
    for (let c = 0; c < k; c++) {
      if (c === own) {
        continue
      }
      const other = vectors.filter((_, j) => labels[j] === c)
      if (other.length === 0) {
        continue
      }
      let dist = 0
      for (const v of other) {
        dist += 1 - cosine(vectors[i]!, v)
      }
      dist /= other.length
      b = Math.min(b, dist)
    }
    if (!Number.isFinite(b)) {
      continue
    }
    const s = (b - a) / Math.max(a, b)
    total += s
    count++
  }
  return count === 0 ? 0 : total / count
}

function clusterSizes(labels: number[], k: number): number[] {
  const sizes = new Array(k).fill(0)
  for (const l of labels) {
    sizes[l]!++
  }
  return sizes
}

/** Top-term vocabulary divergence between clusters (Jaccard distance on top terms). */
export function vocabularyDivergence(
  items: TitleClusterInput[],
  labels: number[],
  k: number
): number {
  const topTermsPerCluster: Set<string>[] = []
  for (let c = 0; c < k; c++) {
    const freq = new Map<string, number>()
    items.forEach((item, i) => {
      if (labels[i] !== c) {
        return
      }
      for (const t of tokenize(item.title)) {
        freq.set(t, (freq.get(t) ?? 0) + 1)
      }
    })
    const top = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t)
    topTermsPerCluster.push(new Set(top))
  }
  let maxDist = 0
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const a = topTermsPerCluster[i]!
      const b = topTermsPerCluster[j]!
      const inter = [...a].filter((x) => b.has(x)).length
      const union = new Set([...a, ...b]).size
      const jaccard = union === 0 ? 0 : inter / union
      maxDist = Math.max(maxDist, 1 - jaccard)
    }
  }
  return maxDist
}

function ambiguousShare(vectors: number[][], labels: number[], k: number): number {
  let clear = 0
  for (let i = 0; i < vectors.length; i++) {
    const sims = []
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, j) => labels[j] === c)
      if (members.length === 0) {
        sims.push(-1)
        continue
      }
      let sum = 0
      for (const v of members) {
        sum += cosine(vectors[i]!, v)
      }
      sims.push(sum / members.length)
    }
    const sorted = [...sims].sort((a, b) => b - a)
    if (sorted[0]! - sorted[1]! >= 0.08) {
      clear++
    }
  }
  return vectors.length === 0 ? 0 : clear / vectors.length
}

export function clusterItemTitles(items: TitleClusterInput[]): TitleClusterResult | null {
  if (items.length < 20) {
    return null
  }

  const vocab = buildVocabulary(items)
  if (vocab.length < 4) {
    return null
  }

  const df = new Map<string, number>()
  for (const item of items) {
    const seen = new Set(tokenize(item.title))
    for (const t of seen) {
      df.set(t, (df.get(t) ?? 0) + 1)
    }
  }

  const vectors = items.map((item) => tfidfVector(tokenize(item.title), vocab, df, items.length))

  let best: TitleClusterResult | null = null

  for (const k of [2, 3]) {
    const labels = kMeans(vectors, k)
    const sizes = clusterSizes(labels, k)
    if (sizes.some((s) => s < MIN_CLUSTER_SIZE)) {
      continue
    }
    const sil = silhouetteScore(vectors, labels, k)
    if (sil < MIN_SILHOUETTE) {
      continue
    }
    const vocabDist = vocabularyDivergence(items, labels, k)
    if (vocabDist < 0.25) {
      continue
    }
    const amb = ambiguousShare(vectors, labels, k)
    const candidate: TitleClusterResult = {
      k,
      assignments: new Map(items.map((item, i) => [item.id, labels[i]!])),
      silhouette: sil,
      ambiguousShare: amb,
    }
    if (!best || sil > best.silhouette) {
      best = candidate
    }
  }

  return best
}

export const SPLIT_CONFIDENCE_THRESHOLD = 0.7

export function splitDetectorConfidence(cluster: TitleClusterResult): number {
  return cluster.silhouette * cluster.ambiguousShare
}
