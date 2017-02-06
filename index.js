const fs = require('fs');
const inputFile = process.argv[2] || './input.txt';
const outputFile = process.argv[3] || './output.txt';
const readStream = fs.createReadStream(inputFile, {encoding: 'utf-8'});
const writeFD = fs.openSync(outputFile, 'w');
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
} else if (!process.argv[3] && fs.existsSync('./output.txt')) {
  // Verify output file
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
} else {
  rl.close();
  startProgram();
}



/*
START OF PROGRAM FUNCTIONALITY
*/

function startProgram() {
  // Variables to be read from the input.txt
  let dataSize, windowSize;

  // Number of times 'data' event is emitted from readable stream pipe
  let chunkCount= 0;
  // WindowRange holds the current values to be analyzed
  // and has length of windowSize when full.
  let valuesInWindow = [];

  // Readable stream allows data to be read in chunks, processed, then written,
  // which frees up the RAM usage by not loading entire chunk of data at once
  readStream.pipe(split(' ')).on('data', value => {
    // Return if value is empty
    if (value === ' ' || value === '') return;

    switch(chunkCount) {
      case 0:
        // First value is the data size
        dataSize = Number(value);
        break;
      case 1:
        // Second value is the windowSize
        // Account for fact that first line of input may not end with space
        windowSize = findWindowSize(value).windowSize;
        firstDataValue = findWindowSize(value).firstDataValue;
        if (firstDataValue) {
          // First data value was fed through pipe with windowCount
          chunkCount++;
          valuesInWindow.push(firstDataValue);
        }
        break;
      default:
        addValueToArray(Number(value));
        if (valuesInWindow.length === windowSize) { // Array is full
          // Calculate value for current range and write to output
          let windowCount = findCountForWindow();
          fs.write(writeFD, windowCount + ' ' + chunkCount + ' \n', err => {
            if (err) throw err;
          });
        }
    }
    // Increase count
    chunkCount++;

  });

  function findWindowSize(value) {
    if (value.search(/\n/g) > -1) { //contains 2 data points
      let pointsArray = value.split('\n').map(Number);
      return {windowSize: pointsArray[0], firstDataValue: pointsArray[1]};
    } else {
      return {windowSize: Number(value), firstDataValue: null};
    }
  }

  function addValueToArray(value) {
    if (valuesInWindow.length === windowSize) { //Shift Values
      valuesInWindow.shift();
      valuesInWindow.push(value);
    } else { //Array not yet full
      valuesInWindow.push(value);
    }
  }

  readStream.on('end', () => {
    if (chunkCount - 2 !== dataSize) {
      console.warn(`The give data size parameter ''${dataSize}'' did not match the
        number of data points processed '${chunkCount - 2}'.  Please check
        the input data.  The processed data can be found in ${outputFile}`);
    } else {
      console.log(`Success!  The processed data can be found in ${outputFile}`);
    }
    fs.closeSync(writeFD);
  });


  /*
  CALCULATION ALGORITHMS START BELOW
  Theoretically, the list of data points only needs to be scanned over one time.
  Everytime the window moves to the right, the point contributing subsets that
  the furthest left most value is a member of must be subtracted, and the entering
  value on the right needs to be added to any subsets that is will contribute to.
  */
  let countTracker = {
    initialRun: true,
    runningCount: 0,
    currentRunType: 0, //1 for increase, -1 for decrease, 0 for same value
    consecutiveRunCount: null,
    pointsContributedByEachValue: [], // With size K - windowsize
  };

  function findCountForWindow() {
    if (countTracker.initialRun) {
      return calculateFirstSubsetCount();
    } else {
      return calculateSubsequentSubsetCount();
    }
  }

  function calculateFirstSubsetCount() {
    countTracker.initialRun = false;
    for (let i = 0, length = valuesInWindow.length; i < length - 1; i++) {
      let type = determineType(valuesInWindow[i + 1], valuesInWindow[i]);
      updateTracker(countTracker, type, i);
    }
    return countTracker.runningCount;
  }

  function determineType(val1, val2) {
    if (val1 > val2) { // Handle increase
      return 1;
    } else if (val1 < val2) { // Handle decrease
      return -1;
    } else {// Equal
      return 0;
    }
  }

  function calculateSubsequentSubsetCount() {
    // Remove leftmost value
    let valueToSubtract = countTracker.pointsContributedByEachValue.shift();
    // Subtract leftmost contribution points from runningCount
    countTracker.runningCount -= valueToSubtract;
    // Determine the type of new value in array
    let type = determineType(
      valuesInWindow[windowSize - 1],
      valuesInWindow[windowSize - 2]
    );
    // Update tracker with new value
    updateTracker(countTracker, type, windowSize - 2);
    return countTracker.runningCount;
  }

  function updateTracker(tracker, type, windowIndex) {
    if (tracker.currentRunType === type) {
      // ConsecutiveRunCount can never equal windowSize
      tracker.consecutiveRunCount = tracker.consecutiveRunCount + 1 ===
          windowSize ? tracker.consecutiveRunCount :
          tracker.consecutiveRunCount + 1;
      // The cumulative count can be caculated by using the consecutive count
      tracker.runningCount += type * tracker.consecutiveRunCount;
      tracker.pointsContributedByEachValue[windowIndex] = 0; // Initialize
      updateContributionArray(windowIndex, tracker.consecutiveRunCount);
    } else {
      // Reset the consecutive count to 1
      tracker.consecutiveRunCount = 1;
      tracker.currentRunType = type;
      tracker.pointsContributedByEachValue[windowIndex] = type;
      //  Add or subtract to count as appropriate.
      tracker.runningCount += type;
    }
  }

  function updateContributionArray(index, consecutiveCount) {
    let leftmostIndexToUpdate = index - consecutiveCount;
    for (let i = index; i > leftmostIndexToUpdate; i--) {
      countTracker.pointsContributedByEachValue[i]++;
    }
  }
};
