import { populateSudokuMatrix, solveSudoku } from "./sudoku.ts";
import { toSparseMatrix } from "./dlx.ts";

console.log('Populating empty board...');
const emptySudoku = populateSudokuMatrix();
console.log('Producing sparse matrix...');
const matrix = toSparseMatrix(emptySudoku);

console.log('Writing sparse matrix...');
await Deno.writeTextFile("./matrix.csv", matrix.map(row => row.join(',')).join('\n'));

console.log('Solving the puzzle...');

const grid = solveSudoku(emptySudoku);
console.log(grid.map(row => row.join(',')).join('\n'));
console.log('Done!');
