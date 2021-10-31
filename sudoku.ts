import { DLXBoardHead, DLXNode, getHorizontalNodes } from "./dlx.ts";
import { appendColumns, createBoardHead, createColumn, prependNode } from "./dlx-builder.ts";
import { exactCoverSolve } from "./dlx-solver.ts";
import { find, map } from './utils.ts';

type SudokuPossibility = {
  row: number;
  col: number;
  val: number;
};

// The basic sudoku board can be expanded, but
// its size must be based on a single square
const BOX_WIDTH = 3;
// Constant for all standard sudoku
const CRITERIA_TYPES = 4;
const BOX_SIZE = (BOX_WIDTH * BOX_WIDTH); // 9
const NUM_BOXES = BOX_SIZE; // 9
const VALID_NUMBERS = BOX_SIZE; // 9
const NUM_COLS = BOX_SIZE; // 9
const NUM_ROWS = NUM_COLS; // 9
const NUM_CELLS = (NUM_ROWS * NUM_COLS); // 81
const NUM_CRITERIA = (NUM_CELLS * CRITERIA_TYPES); // 324
const NUM_POSSIBILITIES = (NUM_CELLS * VALID_NUMBERS); // 728

enum CriteriaType {
  CellFilled = 0,
  RowHasValue = 1,
  ColHasValue = 2,
  BoxHasValue = 3,
}

type BaseCriteria = {
  criteriaId: number;
  type: CriteriaType;
};
type CellCriteria = BaseCriteria & {
  type: CriteriaType.CellFilled;
  row: number;
  column: number;
};
type RowCriteria = BaseCriteria & {
  type: CriteriaType.RowHasValue;
  row: number;
  value: number;
};
type ColCriteria = BaseCriteria & {
  type: CriteriaType.ColHasValue;
  column: number;
  value: number;
};
type BoxCriteria = BaseCriteria & {
  type: CriteriaType.BoxHasValue;
  boxNum: number;
  value: number;
};

type Criteria = CellCriteria | RowCriteria | ColCriteria | BoxCriteria;

type BaseAnswer = { nodeId: number; type: CriteriaType };
type CellAnswer = BaseAnswer & CellCriteria & {
  nodeId: number;
  value: number;
};
type RowAnswer = BaseAnswer & RowCriteria & {
  column: number;
};
type ColAnswer = BaseAnswer & ColCriteria & {
  row: number;
};
type BoxAnswer = BaseAnswer & BoxCriteria & {
  boxPosition: number;
};

type CriteriaAnswer = CellAnswer | RowAnswer | ColAnswer | BoxAnswer;

function getCritriaFromId(id: number): Criteria {
  const criteriaType = Math.floor(id / NUM_CELLS);
  const criteriaPos = id % NUM_CELLS;
  switch (criteriaType) {
    case CriteriaType.CellFilled:
      return {
        criteriaId: id,
        type: criteriaType,
        row: Math.floor(criteriaPos / NUM_ROWS),
        column: criteriaPos % NUM_ROWS,
      };
    case CriteriaType.RowHasValue:
      return {
        criteriaId: id,
        type: criteriaType,
        row: Math.floor(criteriaPos / VALID_NUMBERS),
        value: criteriaPos % VALID_NUMBERS,
      };
    case CriteriaType.ColHasValue:
      return {
        criteriaId: id,
        type: criteriaType,
        column: Math.floor(criteriaPos / VALID_NUMBERS),
        value: criteriaPos % VALID_NUMBERS,
      };
    case CriteriaType.BoxHasValue:
      return {
        criteriaId: id,
        type: criteriaType,
        boxNum: Math.floor(criteriaPos / VALID_NUMBERS),
        value: criteriaPos % VALID_NUMBERS,
      };
    default:
      throw new Error(`Invalid criteria id ${id} > ${NUM_CRITERIA}`);
  }
}

function getBoxIndices(
  row: number,
  column: number,
): { boxNum: number; boxPos: number } {
  //  0   1   2
  //  3   4   5
  //  6   7   8
  const boxNum = Math.floor(row / BOX_WIDTH) * BOX_WIDTH +
    Math.floor(column / BOX_WIDTH);

  // 0-8 within a box.
  const boxPos = (row % BOX_WIDTH) * BOX_WIDTH + column % BOX_WIDTH;
  return {
    boxNum,
    boxPos,
  };
}
function getIdFromCriteria(criteria: Criteria): number {
  switch (criteria.type) {
    case CriteriaType.CellFilled:
      return criteria.row * NUM_ROWS + criteria.column;
    case CriteriaType.RowHasValue:
      return criteria.row * VALID_NUMBERS + criteria.value;
    case CriteriaType.ColHasValue:
      return criteria.column * VALID_NUMBERS + criteria.value;
    case CriteriaType.BoxHasValue:
      return criteria.boxNum * VALID_NUMBERS + criteria.value;
  }
}

function getReadableCriteria(criteria: Criteria): string {
  switch (criteria.type) {
    case CriteriaType.CellFilled:
      return `Cell(${criteria.row},${criteria.column})`;
    case CriteriaType.RowHasValue:
      return `Row(${criteria.row}):${criteria.value}`;
    case CriteriaType.ColHasValue:
      return `Col(${criteria.column}):${criteria.value}`;
    case CriteriaType.BoxHasValue:
      return `Box(${criteria.boxNum}):${criteria.value}`;
  }
}

function getReadableInterpretation(answer: CriteriaAnswer): string {
  switch (answer.type) {
    case CriteriaType.CellFilled:
      return `Cell(${answer.row},${answer.column})=${answer.value}`;
    case CriteriaType.RowHasValue:
      return `Row(${answer.row}):${answer.value}@${answer.column}`;
    case CriteriaType.ColHasValue:
      return `Col(${answer.column}):${answer.value}@${answer.row}`;
    case CriteriaType.BoxHasValue:
      return `Box(${answer.boxNum}):${answer.value}@${answer.boxPosition}`;
  }
}

function interpretNode(node: DLXNode): CriteriaAnswer {
  const criteria = getCritriaFromId(node.head.id);
  switch (criteria.type) {
    case CriteriaType.CellFilled:
      return {
        nodeId: node.id,
        ...criteria,
        value: node.id,
      };
    case CriteriaType.RowHasValue:
      return {
        nodeId: node.id,
        ...criteria,
        column: node.id,
      };
    case CriteriaType.ColHasValue:
      return {
        nodeId: node.id,
        ...criteria,
        row: node.id,
      };
    case CriteriaType.BoxHasValue:
      return {
        nodeId: node.id,
        ...criteria,
        boxPosition: node.id,
      };
  }
}

export function populateSudokuMatrix(): DLXBoardHead {
  // Build a DLX board of NUM_CRITERIA columns each with VALID_NUMBERS options.

  const boardHead = createBoardHead();
  const columns: Array<ReturnType<typeof createColumn>> = [];
  for (let i = 0; i < NUM_CRITERIA; i++) {
    const description = getReadableCriteria(getCritriaFromId(i));
    columns.push(createColumn(i, VALID_NUMBERS, description));
  }

  // Add these columns to our grid.
  appendColumns(boardHead, columns.map((x) => x.head));

  // Now that we've created all of our columns, let's connect the nodes appropriately

  // Our first 81 criteria are Cell(i,j) = k
  // Let's determine which other criteria each of these satisfy and connect their rows.
  for(let i = 0; i < NUM_ROWS; i++) {
    for(let j = 0; j < NUM_COLS; j++) {
      for(let k = 0; k < VALID_NUMBERS; k++) {
        // Get the relevant column/node indexes for all constraints related to row i, column j, value k
        const { cell, row, column, box } = getRelatedAnswers(i, j, k);

        // Pull out the cell node first
        const cellNode = columns[cell.criteriaId].nodes[cell.nodeId];
        cellNode.description = getReadableInterpretation(cell);
        // Prepend all other nodes to it, so the order ends up cell -> row -> column -> box -> cell ...
        [row, column, box].forEach(answer => {
          const node = columns[answer.criteriaId].nodes[answer.nodeId];
          node.description = getReadableInterpretation(answer);
          //console.log(`Connecting ${getReadableInterpretation(cell)} with ${getReadableInterpretation(answer)}`)
          prependNode(cellNode, node);
        });
      }
    }
  }
  return boardHead;
}

function getRelatedCriteria(row: number, column: number, value: number): {
  cell: CellCriteria;
  row: RowCriteria;
  column: ColCriteria;
  box: BoxCriteria;
} {
  const { boxNum } = getBoxIndices(row, column);
  return {
    cell: {
      criteriaId: row * NUM_ROWS + column,
      type: CriteriaType.CellFilled,
      row,
      column,
    },
    row: {
      criteriaId: row * VALID_NUMBERS + value,
      type: CriteriaType.RowHasValue,
      row,
      value,
    },
    column: {
      criteriaId: column * VALID_NUMBERS + value,
      type: CriteriaType.ColHasValue,
      column,
      value,
    },
    box: {
      criteriaId: boxNum * VALID_NUMBERS + value,
      type: CriteriaType.BoxHasValue,
      boxNum,
      value,
    },
  };
}

function getRelatedAnswers(row: number, column: number, value: number): {
  cell: CellAnswer;
  row: RowAnswer;
  column: ColAnswer;
  box: BoxAnswer;
} {
  const { boxNum, boxPos } = getBoxIndices(row, column);
  return {
    cell: {
      criteriaId: row * NUM_ROWS + column,
      nodeId: value,
      type: CriteriaType.CellFilled,
      row,
      column,
      value,
    },
    row: {
      criteriaId: NUM_CELLS + row * VALID_NUMBERS + value,
      nodeId: column,
      type: CriteriaType.RowHasValue,
      row,
      column,
      value,
    },
    column: {
      criteriaId: NUM_CELLS * 2 + column * VALID_NUMBERS + value,
      nodeId: row,
      type: CriteriaType.ColHasValue,
      row,
      column,
      value,
    },
    box: {
      criteriaId: NUM_CELLS * 3 + boxNum * VALID_NUMBERS + value,
      nodeId: boxPos,
      type: CriteriaType.BoxHasValue,
      boxNum,
      value,
      boxPosition: boxPos,
    },
  };
}

export function solveSudoku(boardHead: DLXBoardHead) {
  const results = exactCoverSolve(boardHead);
  // Results will be a set of selected nodes.
  // We must traverse each node's row to find the "Cell filled" node it corresponds to.
  const sudokuGrid = new Array(NUM_ROWS).fill(0).map(x => new Array(NUM_COLS));
  for(const row of results) {
    const cellNode = find(map(getHorizontalNodes(row), (row) => interpretNode(row)), (answer): answer is CellAnswer => answer.type === CriteriaType.CellFilled)!;
    // console.log(getReadableInterpretation(cellNode));
    sudokuGrid[cellNode.row][cellNode.column] = cellNode.value + 1;
  }
  return sudokuGrid;
}
