const fs = require('fs');
const inputFile = process.argv[2] || './input.txt';
const outputFile = process.argv[3] || './output.txt';
const readStream = fs.createReadStream(inputFile, {encoding: 'utf-8'});
const writeStream= fs.createWriteStream(outputFile);
const readline = require('readline');
const split = require('split');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check for input arguments
if (!process.argv[2] && !fs.existsSync('./input.txt')) {
  console.log(
    `You must either provide a file to process as the second argument
    --> node index.js <inputFile> <outputFile>
    or an input.txt file must exist in the current directory`);
  process.exit();
}

// Verify output file
if (!process.argv[3] && fs.existsSync('./output.txt')) {
  console.warn(
    `You did not specify an output file.  The output file will overwrite the
    current output.txt file in the current directory.  Do you wish to continue?`
  );

  rl.on('line', answer => {
    if (!answer) {
      console.log('print yes (y) or no (n)');
    } else if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.close();
      startProgram();
    } else if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
      console.log('exiting process');
      process.exit();
    } else {
      console.log('print yes (y) or no (n)');
    }
  });
}



/*
START OF PROGRAM FUNCTIONALITY
*/

function startProgram() {
  let dataSize;
  let windowSize = 1;
  let chunkCount= 0;
  // WindowRange holds the current values to be analyzed
  // and has length of windowSize.
  let windowRangeArray = [];
  let index = 0;

  readStream.pipe(split(' ')).on('data', value => {
    // Return immediately if value is empty space
    if (value === ' ') return;

    switch(chunkCount) {
      case 0:
        dataSize = Number(value);
        break;
      case 1:
        // Account for fact that first line of input may not end with space
        windowSize = findWindowSize(value).windowSize;
        firstDataValue = findWindowSize(value).windowSize;
        if (firstDataValue) {
          chunkCount++;
          windowRangeArray.push(Number(value));
        }
        break;
      default:
        if (windowRangeArray.length === windowSize) { // Array is full
          // Calculate value for current range and write to output
          writeStream.write(findCountForWindow(windowRangeArray), ' ', chunkCount)
          shiftArrayRange(Number(value));
        } else { //Array is not yet full
          windowRangeArray.push(Number(value));
        }

    }

    chunkCount++;

    if (chunkCount > 20) {
      process.exit();
    }
  });

  function findWindowSize(value) {
    if (value.search(/\n/g) > -1) { //contains 2 data points
      let pointsArray = value.split('\n').map(Number);
      return {windowSize: pointsArray[0], firstDataValue: pointsArray[1]};
    } else {
      return {windowSize: Number(value), firstDataValue: null};
    }
  }

  function shiftArrayRange(value) {
    windowRangeArray.shift();
    windowRangeArray.push(value);
  }

  function findCountForWindow(windowRange) {
    let countTracker = {
      count: 0,
      type: 0, //1 for increase, -1 for decrease, 0 for same value
      consecutiveCount: 0
    };

    for (let i = 0, length = windowRange.length; i < length; i++) {
      if (windowRange[i + 1] > windowRange[i]) {
        updateTracker(countTracker, 1);
      } else if (windowRange[i + 1] < windowRange[i]) {
        updateTracker(countTracker, -1);
      } else {
        updateTracker(countTracker, 0);
      }
    }

    function updateTracker(tracker, type) {
      if (tracker.type === type) {
        tracker.consecutiveCount++;
        tracker.count += tracker.type * tracker.consecutiveCount;
      } else {
        tracker.consecutiveCount = 1;
        tracker.type = type;
        tracker.count += tracker.type * tracker.consecutiveCount;
      }
    }
    return countTracker.count;
  }


};
