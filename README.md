# amne
A program for calulating increasing and decreasing subranges.

Sample Input

    5 3 //Data size and Window Size
    188930 194123 201345 154243 154243 //Space separated data

Sample Output

    3
    0
    -1

Explanation

For the first window of [188930, 194123, 201345], there are 3 increasing subranges ([188930, 194123, 201345], [188930, 194123], and [194123, 201345]) and 0 decreasing, so the answer is 3. For the second window of [194123, 201345, 144500], there is 1 increasing subrange and 1 decreasing, so the answer is 0. For the third window of [201345, 154243, 154243], there is 1 decreasing subrange and 0 increasing, so the answer is -1.

## use 
npm install
node index.js [path to input file] [path to outputfile]

Both paths are optional.  If there is an input.txt file in the current directory, the program will use that.  The program will
warn you before overwriting any output file.

