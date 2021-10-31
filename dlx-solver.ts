import {
  DLXBoardHead,
  DLXHeadNode,
  DLXNode,
  getHorizontalNodesExcept,
  getVerticalNodesExcept,
  relinkHorizontally,
  relinkVertically,
  unlinkHorizontally,
  unlinkVertically,
} from "./dlx.ts";

function cover(column: DLXHeadNode) {
  // console.log(`Covering column ${column.id} (${column.description})`);
  // Remove this column from our board.
  unlinkHorizontally(column);

  // Take every node in this column and remove its row neighbors from their column

  for (const thisColumnNode of getVerticalNodesExcept(column)) {
    for (const rowNeighborNode of getHorizontalNodesExcept(thisColumnNode)) {
      unlinkVertically(rowNeighborNode);
    }
  }
}

function uncover(column: DLXHeadNode) {
  // console.log(`Uncovering column ${column.id} (${column.description})`);
  // Reinsert all rows in this column to the matrix of possible solutions
  for (const thisColumnNode of getVerticalNodesExcept(column)) {
    // Re-link all this node's row neighbors into their columns.
    for (const rowNeighborNode of getHorizontalNodesExcept(thisColumnNode)) {
      relinkVertically(rowNeighborNode);
    }
  }

  // Add this column back to our board
  relinkHorizontally(column);
}

export function select(row: DLXNode) {
  // console.log(`Selecting answer ${row.id} (${row.description})`);
  // If we select this row, we should mark all other constraints
  // that this row satisfies as covered.
  for (const node of getHorizontalNodesExcept(row)) {
    cover(node.head);
  }
}
export function deselect(row: DLXNode) {
  // console.log(`Deselecting answer ${row.id} (${row.description})`);
  // If we deselect this row, we should mark all other constraints
  // that this row satisfies as uncovered again.
  for (const node of getHorizontalNodesExcept(row)) {
    uncover(node.head);
  }
}
export function exactCoverSolve(boardHead: DLXBoardHead): DLXNode[] {
  const answerNodes: DLXNode[] = [];

  //let recursionDepth = 0;
  function recursiveSolve() {
    // console.log(`Recursion depth ${recursionDepth++}`);
    if (boardHead.right === boardHead) {
      // We have completely covered this board. There are no constraints left to cover.
      return true;
    }
    // Heuristic: Select the column with the lowest value
    // Optimization? We could keep these columns in a min heap.
    const targetColumn = selectSmallestColumnIfSolutionPossible(boardHead);
    if (!targetColumn) {
      // There are constraints remaining that have zero possible options to fulfill them.
      return false;
    }

    // Choose to cover this column--we are going to try to fill this constraint next.
    cover(targetColumn);

    // For each node in this column (each possibility), we should try selecting this solution to the constraint.
    for (const node of getVerticalNodesExcept(targetColumn)) {
      select(node);
      answerNodes.push(node);
      // Try solving the remaining board
      if (recursiveSolve()) {
        // We found a solution! Woohoo!
        return true;
      }
      // We didn't find a solution. Let's re-link this row.
      deselect(node);
      answerNodes.pop();
    }
    // We didn't find a solution for this column constraint. Let's uncover it and return.
    uncover(targetColumn);
    return false;
  }
  recursiveSolve();

  return answerNodes;
}

function selectSmallestColumnIfSolutionPossible(boardHead: DLXBoardHead) {
  let minVal = Infinity;
  let minCol: DLXHeadNode | undefined = undefined;
  for (const col of getHorizontalNodesExcept(boardHead as DLXHeadNode)) {
    if (col.size === 0) {
      // We found a constraint that cannot be satisfied!
      // Return early so we can aboard this solution
      return undefined;
    }

    if (col.size < minVal) {
      minVal = col.size;
      minCol = col;
    }
  }
  return minCol;
}
