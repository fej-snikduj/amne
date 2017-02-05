const fs = require('fs');
const inputFile = process.argv[2] || './input.txt';
const outputFile = process.argv[3] || './output.txt';
const readStream = fs.createReadStream(inputFile, {encoding: 'utf-8'});
const writeStream= fs.createWriteStream(outputFile);
const readline = require('readline');
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

function startProgram() {
  readStream.on('data', data => {

    // Transform data into array
    let array = data.split(/\r?\n/);
    let [dataSize, windowSize] = array[0].split(' ').map(Number);
    let inputData = array[1].split(' ').map(Number);

    // Check to make sure stated input length N is same as array length
    if (inputData.length !== dataSize) {
      console.error(`The input of '${dataSize}'' does not match actual data size
      of '${inputData.length}'.  Please check data and try again.`);
      process.exit();
    }

    // Release reference to array, which is not needed
    array = null;

    // Iterate over input data, performing calculation on each window range
    inputData.forEach((price, index, array) => {
      // Return if at end of array
      if (index + windowSize > array.length) {
        return;
      }
      // Find the count for the current window
      let windowCount = findCountForWindow(index, index + windowSize - 1, array);
      // Print the count to the output file
      writeStream.write(windowCount + '\n');
    });
    writeStream.end();

  });


  function findCountForWindow(windowLeftIndex, windowRightIndex, inputData) {
    let countTracker = {
      count: 0,
      type: 0, //1 for increase, -1 for decrease, 0 for same value
      consecutiveCount: 0
    };

    for (let i = windowLeftIndex; i < windowRightIndex; i++) {
      if (inputData[i + 1] > inputData[i]) {
        updateTracker(countTracker, 1);
      } else if (inputData[i + 1] < inputData[i]) {
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

}
