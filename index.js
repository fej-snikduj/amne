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
  let chunk = 0;
  // WindowRange holds the current values to be analyzed
  // and has length of windowSize.
  let windowRange = [];
  let index = 0;

  readStream.pipe(split(' ')).on('data', value => {
    // Keep track of data value index (mines the 2 input parameters)
    index = (chunk - 2);
      if (chunk === 0) {
        dataSize = value;
      } else if (chunk === 1) {
        // Account for fact that first line of input may not end in a space
        if (value.search(/\n/g) > -1) {
          let valueArray = value.split('\n');
          windowSize = Number(valueArray[0]);
          windowRange[0] = Number(valueArray[1]);
          chunk++;
        } else {
          windowSize = Number(value);
        }
      } else if (chunk <= windowSize){
        console.log('yayay');
        windowRange[index] = Number(value);
      }

    if (chunk > windowSize) {
      console.log(windowRange, 'windowRange');
      let windowCount = findCountForWindow(windowRange);
      // Print the count to the output file
      writeStream.write(windowCount + ' ' + chunk + '\n');
    }
    if (chunk > 20) {
      process.exit();
    }
    chunk++;
  });

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
