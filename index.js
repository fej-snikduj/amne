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
  let writeCount = 0;

  // An array to hold the values as they are processed
  let dataPoints = [];

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
          dataPoints.push(firstDataValue);
        }
        break;
      default:
        dataPoints.push(Number(value));
        if (dataPoints.length >= windowSize) { // Array is full
          // Calculate value for current range and write to output
          let windowCount = findCountForWindow(chunkCount - 2);
          fs.write(writeFD, windowCount + '\n', err => {
            if (err) throw err;
          });
          writeCount++;
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

  readStream.on('end', () => {
    if (chunkCount - 2 !== dataSize) {
      console.warn(`The give data size parameter ''${dataSize}'' did not match the
        number of data points processed '${chunkCount - 2}'.  Please check
        the input data.  The processed data can be found in ${outputFile}`);
    } else {
      console.log(`Success!  The processed data can be found in ${outputFile}
        A total of ${writeCount} points were written.`);
    }
  });


  /*
  CALCULATION ALGORITHMS START BELOW
  The list of data points only needs to be scanned over one time.
  Everytime the window moves to the right, the point contributing subsets that
  the furthest left most value is a member of must be subtracted, and the entering
  value on the right needs to be added to any subsets that is will contribute to.
  */
  let countTracker = {
    initialRun: true,
    runningCount: 0,
    currentRunType: null, //1 for increase, -1 for decrease, 0 for same value
    consecutiveRunCount: null,
    pointsContributedByEachValue: [],
  };

  function findCountForWindow(index) {
    if (countTracker.initialRun) {
      return calculateFirstSubsetCount();
    } else {
      return calculateSubsequentSubsetCount(index);
    }
  }

  function calculateFirstSubsetCount() {
    countTracker.initialRun = false;
    for (let i = 0, length = dataPoints.length; i < length - 1; i++) {
      let type = determineType(dataPoints[i + 1], dataPoints[i]);
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

  function calculateSubsequentSubsetCount(index) {
    // Find value contributed by node leaving the window
    let valueToSubtract =
        countTracker.pointsContributedByEachValue[index - windowSize];
    // Subtract value from running count
    countTracker.runningCount -= valueToSubtract;
    // Determine the type caused by addition of next data point
    let type = determineType(
      dataPoints[index],
      dataPoints[index - 1]
    );
    // Update tracker with new value
    updateTracker(countTracker, type, index - 1);
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
      updateContributionArray(windowIndex, tracker.consecutiveRunCount, type);
    } else {
      // Reset the consecutive count to 1
      tracker.consecutiveRunCount = 1;
      tracker.currentRunType = type;
      tracker.pointsContributedByEachValue[windowIndex] = type;
      //  Add or subtract to count as appropriate.
      tracker.runningCount += type;
    }
  }

  function updateContributionArray(index, consecutiveCount, type) {
    let leftmostIndexToUpdate = index - consecutiveCount;
    for (let i = index; i > leftmostIndexToUpdate; i--) {
      if (type === 1) {
        countTracker.pointsContributedByEachValue[i]++;
    } else if (type === -1) {
        countTracker.pointsContributedByEachValue[i]--;
    }
  }
};

}
