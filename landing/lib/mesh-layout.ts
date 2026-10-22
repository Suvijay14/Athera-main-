export type MeshPoint = { x: number; y: number }

export const MESH_REF_WIDTH = 1200
export const MESH_REF_HEIGHT = 720

/** Precomputed scatter — min 110px between centers on 1200×720 */
export const POSITIONS_24: MeshPoint[] = [
  { x: 710.9, y: 514.8 },
  { x: 779.6, y: 391.8 },
  { x: 360.6, y: 402.3 },
  { x: 295.6, y: 266.5 },
  { x: 1001.0, y: 340.0 },
  { x: 783.1, y: 181.3 },
  { x: 287.8, y: 553.2 },
  { x: 513.4, y: 463.2 },
  { x: 221.2, y: 415.0 },
  { x: 904.9, y: 486.1 },
  { x: 943.5, y: 181.5 },
  { x: 586.9, y: 163.3 },
  { x: 646.7, y: 256.8 },
  { x: 414.2, y: 133.2 },
  { x: 553.7, y: 576.7 },
  { x: 447.7, y: 295.5 },
  { x: 408.0, y: 579.5 },
  { x: 859.4, y: 599.2 },
  { x: 149.6, y: 271.6 },
  { x: 888.2, y: 298.8 },
  { x: 1025.7, y: 448.8 },
  { x: 696.7, y: 97.5 },
  { x: 731.6, y: 637.8 },
  { x: 281.4, y: 155.5 },
]

/** Precomputed scatter — min 90px between centers (12 icons) */
export const POSITIONS_12: MeshPoint[] = [
  { x: 824.2, y: 438.3 },
  { x: 639.4, y: 176.0 },
  { x: 283.5, y: 436.5 },
  { x: 275.9, y: 539.8 },
  { x: 378.8, y: 363.6 },
  { x: 945.9, y: 479.6 },
  { x: 792.5, y: 534.5 },
  { x: 827.4, y: 246.5 },
  { x: 449.5, y: 297.9 },
  { x: 966.2, y: 295.4 },
  { x: 801.3, y: 332.7 },
  { x: 585.8, y: 593.8 },
]

export type MeshEdge = { from: number; to: number | 'you'; key: string }

export function buildMeshEdges(count: number): MeshEdge[] {
  const edges: MeshEdge[] = []
  for (let i = 0; i < count; i++) {
    edges.push({ from: i, to: 'you', key: `you-${i}` })
    const j = (i + 5) % count
    const k = (i + 11) % count
    if (j !== i) edges.push({ from: i, to: j, key: `x-${i}-${j}` })
    if (k !== i && k !== j) edges.push({ from: i, to: k, key: `x-${i}-${k}` })
  }
  return edges
}

export function scaleMeshPoint(
  p: MeshPoint,
  width: number,
  height: number,
  refW = MESH_REF_WIDTH,
  refH = MESH_REF_HEIGHT
) {
  return { x: (p.x / refW) * width, y: (p.y / refH) * height }
}

export function curvedPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const cx = mx - dy * 0.12
  const cy = my + dx * 0.12
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}
