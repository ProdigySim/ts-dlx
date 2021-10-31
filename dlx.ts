export type DLXBoardHead = {
  left: DLXHeadNode;
  right: DLXHeadNode;
};
export type DLXHeadNode = DLXNode & {
  id: number;
  description?: string;
  size: number;
  left: DLXHeadNode | DLXBoardHead;
  right: DLXHeadNode | DLXBoardHead;
};
export type DLXNode = {
  id: number;
  description?: string;
  head: DLXHeadNode;
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
};

type HorizontallyLinkedNode = DLXNode | DLXHeadNode | DLXBoardHead;
type VerticallyLinkedNode = DLXNode | DLXHeadNode;

function debugPrintHead(column: DLXHeadNode) {
  console.log(`${column.id} has ${column.size} nodes`);
}
function debugPrintNode(node: DLXNode) {
  console.log(
    `Node is a member of columns ${node.head.id} with ${
      node.head.size - 1
    } other nodes`,
  );
}

export function unlinkVertically<T extends VerticallyLinkedNode>(node: T): T {
  node.up.down = node.down;
  node.down.up = node.up;
  node.head.size--;
  return node;
}

export function unlinkHorizontally<T extends HorizontallyLinkedNode>(
  node: T,
): T {
  node.left.right = node.right;
  node.right.left = node.left;
  return node;
}

export function relinkVertically<T extends VerticallyLinkedNode>(node: T): T {
  node.up.down = node;
  node.down.up = node;
  node.head.size++;
  return node;
}

export function relinkHorizontally<T extends HorizontallyLinkedNode>(
  node: T,
): T {
  const casted = node as DLXNode;
  casted.left.right = casted;
  casted.right.left = casted;
  return node;
}

/**
 * Get all nodes vertically linked
 * @param from Node to start iterating from
 */
export function* getVerticalNodes(from: DLXNode) {
  yield from;
  yield* getVerticalNodesExcept(from);
}
/**
 * Get all nodes vertically linked except for the one initially specified
 * @param from Starting node, which will not be yielded.
 */
export function* getVerticalNodesExcept(from: DLXNode) {
  for (let node = from.down; node !== from; node = node.down) {
    yield node;
  }
}

/**
 * Get all nodes horizontally linked
 * @param from Node to start iterating from
 */
export function* getHorizontalNodes<T extends HorizontallyLinkedNode>(
  from: T,
): Iterable<T> {
  yield from;
  yield* getHorizontalNodesExcept(from);
}
/**
 * Get all nodes horizontally linked except for the one initially specified
 * @param from Starting node, which will not be yielded.
 */
export function* getHorizontalNodesExcept<T extends HorizontallyLinkedNode>(
  from: T,
): Iterable<T> {
  for (let node = from.right; node !== from; node = node.right) {
    yield node as T;
  }
}


export function toSparseMatrix(boardHead: DLXBoardHead): number[][] {
  const visitedNodes = new Set<DLXNode>();
  const columns = Array.from(getHorizontalNodesExcept(boardHead as DLXHeadNode));

  const results: number[][] = [];
  for(const col of columns) {
    // console.log(`Trying nodes in column ${col.id}`)
    for(const node of getVerticalNodesExcept(col)) {
      // console.log(`Node ${node.id}`);
      if(visitedNodes.has(node)) break;
      const row: number[] = new Array(columns.length).fill(0);
      row[node.head.id] = 1;
      let count = 1;
      visitedNodes.add(node);
      for(const neighbor of getHorizontalNodesExcept(node)) {
        // console.log(`Neighbor @ col ${neighbor.head.id} (id: ${neighbor.id})`);
        row[neighbor.head.id] = 1;
        visitedNodes.add(neighbor);
        count++;
      }
      console.log(count);
      results.push(row);
    }
  }
  return results;
}