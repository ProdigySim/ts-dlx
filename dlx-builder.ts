import {
  DLXBoardHead,
  DLXHeadNode,
  DLXNode,
  relinkHorizontally,
  relinkVertically,
  getVerticalNodesExcept,
} from "./dlx.ts";

import { assertEquals } from "https://deno.land/std@0.113.0/testing/asserts.ts";

export function createColumn(id: number, numRows: number, description?: string) {
  const head = { id, description, size: 0 } as DLXHeadNode;
  head.left = head.right = head;
  head.up = head.down = head;

  const nodes: DLXNode[] = [];
  let lastNode: DLXNode = head;
  for (let i = 0; i < numRows; i++) {
    lastNode = createNode(lastNode, head, i)
    relinkVertically(lastNode);
    nodes.push(lastNode);
  }
  if(head.size !== numRows) {
    throw new Error(`Relinking nodes produced incorrect size: ${head.size} (requested: ${numRows})`);
  }
  assertEquals(Array.from(getVerticalNodesExcept(head)), nodes, "Constructed and discovered node arrays don't match");
  return {
    head,
    nodes,
  } as const;
}

export function appendColumns(
  boardHead: DLXBoardHead,
  columns: DLXHeadNode[],
): void {
  columns.forEach((headNode) => {
    // Insert this head node just to the left of the board head--so it becomes last in the list
    headNode.left = boardHead.left;
    headNode.right = boardHead as DLXHeadNode;
    relinkHorizontally(headNode);
  });
}

export function prependNode(existingNode: DLXNode, prependNode: DLXNode): void {
  prependNode.left = existingNode.left;
  prependNode.right = existingNode;
  relinkHorizontally(prependNode);
}

export function createBoardHead(): DLXBoardHead {
  const boardHead = {} as DLXBoardHead;
  boardHead.left = boardHead as DLXHeadNode;
  boardHead.right = boardHead as DLXHeadNode;
  return boardHead;
}

// Create a node under a given column after a specified node.
function createNode(
  aboveLink: DLXNode | undefined,
  head: DLXHeadNode,
  id: number,
) {
  const node = { head, id } as DLXNode;
  node.up = aboveLink ?? node;
  node.down = aboveLink?.down ?? node;
  node.left = node.right = node;
  return node;
}
