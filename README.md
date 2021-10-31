# ts-dlx

A TypeScript implementation of [Donald Knuth's Dancing Links Algorithm](https://en.wikipedia.org/wiki/Dancing_Links).

Doing Leetcode problems this year (2021) had me thinking about Exact Cover problems and DLX. [I had built one of these in C++ for CS153 at Missouri S&T](https://github.com/ProdigySim/MST-CS/tree/main/cs153/assignment13), so I pulled out my old notes and tried to rebuild it in TypeScript.

It's a fun opportunity to use generators and 2D doubly linked lists.

## What is Dancing Links?

I think of Dancing Links a lot like solving a [Matrix Logic Puzzle](https://www.google.com/search?q=matrix+logic+puzzles&sxsrf=AOaemvJOOM2fzI3HX8H6Yr9RZYVJSHd1lQ:1635651321796&source=lnms&tbm=isch&sa=X&ved=2ahUKEwjxy4uA3PPzAhX0m2oFHVmDDJkQ_AUoAXoECAEQAw&biw=2256&bih=1345). You try one of the answers, cross off everything in related rows/columns. Pick another blank space to try an answer. If there are no more valid answers, backtrack! Un-cross off answers, and pick another possible answer.

If you can identify:

* A list of constraints
* A list of possible answers to fill each constraint
* A mapping of how answers for one constraint relate to answers under another constraint

You can combine these into a sparse matrix which represents an unsolved logic puzzle, select any pre-filled answers that you want, and let the solver go to town finding a solution.

### Sudoku Example 
For example, for a sudoku you have 4 types of constraints:

<ol>
<li>Each cell must be filled (81 constraints)
    <ul><li>And it can be possibly filled with a value 1-9</li></ul>
</li>
<li>Each row must contain one of each value (9 rows * 9 values of constraints)
  <ul><li>And it can be possibly filled with that value at column 1-9</li></ul>
  </li>
<li>Each column must contain one of each value (9 columns * 9 values of constraints)
  <ul><li>And it can be possibly filled with that value at row 1-9</li></ul>
  </li>
<li>Each box must contain one of each value (9 boxes * 9 values of constraints)
  <ul><li>And it can be possibly filled with that value at 9 different positions</li></ul>
  </li></ol>

This gives us the constraints, and their possible answers. I use a shorthand for these in my program for easier debugging. Please excuse the off-by-one issue.

* `Cell(0,5)` refers to the constraint that the Cell at row 1 column 6 must contain a value. `Cell(0,5)=2` refers to the specific answer to that constraint: Filling the cell with the number 3.
* `Row(0):1` refers to the constrtaint that Row 1 must contain the value 2. `Row(0):1@4` refers to the specific answer to that constraint: Filling in 2 at column 5 in row 1.
* `Box(1):4` refers to the constraint that Box 2 (Cells between rows 1-3 and columns 4-6) must contain the value 2. `Box(1):4@8` refers to filling in 4 at Box 2's bottom-rightmost cell.

We have constraints and answers covered. But now we need to RELATE answers to different constraints to each other. For any given answer to a constraint, there will be 3 related answers: one from each other constraint type. For example:

* `Cell(0,5)=2` <-> `Row(0):2@5` <-> `Col(5):2@0` <-> `Box(1):2@2`
* Filling in cell at row 1, column 6 with value 2 satisfies the row-value constraint, the col-value constraint, and box-value constraint at these specific answer points.

We can essentially fill out all of these constraints & answers into a sparse matrix of 0s and 1s, where related answers share a row. The resulting matrix is 324 columns (one per constraint) by 729 rows--with 4 1s in each row.

If you run this program locally, it will produce a CSV form of this sparse matrix to visualize the problem.

### How does solving actually work?
The solver runs the following process recursively:

<ol>
    <li>Choose an arbitrary constraint that still has not been covered
        <ol>
            <li>You may want to apply a heuristic when selecting a constraint, such as choosing the constraint with the least possible answers remaining.</li>
            <li>If no constraints remain in the grid, `return true`! We have fully covered the grid.</li>
        </ol>
    </li>
    <li>Mark that constraint as "Covered"
        <ol>
            <li>Unlink the constraint from the doubly-linked constraint list</li>
            <li>For every remaining possible answer under that constraint, remove all answers related to it from the grid
                <ol>
                    <li>e.g., if we cover `Cell(0,0)`, we would travel to every such answer `Cell(0,0)=0`, identify its related `Row`, `Col`, and `Box` answers, and remove those answers from their constraint column.</li>
                </ol>
            </li>
        </ol>
    </li>
    <li>Select an arbitrary answer for that constraint
        <ol>
            <li>Mark all constraints satisfied by related answers as covered</li>
            <li>Add that answer row to our solution</li>
            <li>Repeat the process from 1. with the resulting grid.</li>
            <li>If the grid was solved, `return true` here as well!</li>
            <li>If not, remove this answer row from our solution, and uncover the related constraints we covered.</li>
        </ol>
    </li>
    <li>Repeat from 3 for every other possible answer under this constraint</li>
    <li>If none of the possible answers had a solution, uncover the selected constraint, and `return false`.</li>
</ol>



### TODO

- Move sudoku solver to unit tests
- Build N-queens solver
- Generically support multiple sizes of sudoku in sudoku solver
- Export core DLX components as a library.
