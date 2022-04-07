const form = document.querySelector("form");
const tbody = document.querySelector("tbody");
const totalTime = document.getElementById("total-time");
const arrivalTime = document.getElementById("arrival-time");
const animateBtn = document.getElementById("animate-btn");
const turnaroundSpan = document.getElementById("turnaroud-time");
const waitingSpan = document.getElementById("waiting-time");
const responseSpan = document.getElementById("response-time");

class Process {
  constructor(id, totalTime, arrivalTime) {
    this.id = id
    this.totalTime = totalTime
    this.burstTime = totalTime
    this.arrivalTime = arrivalTime
    this.processTime = 0
    this.startTime = -1
    this.completionTime = -1
    this.turnaroundTime = -1
    this.waitingTime = -1
    this.responseTime = -1
    this.isCompleted = false
    this.hue = Math.round(Math.random() * 360)
  }
}

const processList = [];
let id = 1;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addProcess();
});

function addProcessToTable(process) {
  const tr = document.createElement("tr")
  const cols = ["id", "totalTime", "arrivalTime"]

  cols.forEach(col => {
    const td = document.createElement("td")
    td.innerHTML = process[col]
    tr.appendChild(td)
  })

  tbody.appendChild(tr)
}

function addProcess() {
  if (totalTime.value === "" || arrivalTime === "") return;

  // create process
  const process = new Process(id++, parseInt(totalTime.value), parseInt(arrivalTime.value))

  //   add to queue
  processList.push(process);

  // add to table
  addProcessToTable(process)

  //   clear inputs
  totalTime.value = "";
  arrivalTime.value = "0";

}


function DataSet(data, index) {
  this.label = `Iteración: ${index + 1}`;
  this.data = data;
  this.backgroundColor = processList.map(
    (process) => `hsl(${process.hue}, 50%, 70%)`
  );
  this.borderColor = processList.map(
    (process) => `hsl(${process.hue}, 80%, 30%)`
  );
  this.borderWidth = 3;
  this.borderSkipped = false;
  this.borderRadius = 15;
}

function displayHiddenElements() {
  const chartBox = document
    .getElementById("chartBox")
    .classList.remove("hidden");

  const hiddenTable = document.querySelectorAll(".hidden-table");
  hiddenTable.forEach((element) => element.classList.remove("hidden-table"));
}


function updateTable() {
  const rows = tbody.getElementsByTagName("tr");
  const cols = ['startTime', 'completionTime', 'turnaroundTime', 'waitingTime', 'responseTime']

  let i = 0;
  for (let row of rows) {
    for (let col of cols) {
      const td = document.createElement("td")
      td.textContent = processList[i][col]
      row.appendChild(td)
    }
    i++
  }
}

function makeDatasets(times) {
  // create a dataset for each entry in times
  return (
    times.map((data) => (
      {
        data: data,
        backgroundColor: processList.map(process => `hsl(${process.hue}, 50%, 50%)`),
        borderColor: processList.map(process => `hsl(${process.hue}, 50%, 50%)`),
      })
    )
  )
}

function srtf() {
  let completed = 0
  let currentTime = 0
  const queue = []
  const times = []

  while (completed < processList.length) {
    // add processes to the queue that have just entered
    processList.filter(process => process.arrivalTime === currentTime).forEach(process => queue.push(process))

    // sort queue by processTime
    queue.sort((a, b) => a.totalTime - b.totalTime)

    // get process with minimum process time
    const process = queue[0]

    // check if process is getting cpu access for the first time
    if (process.startTime === -1) {
      process.startTime = currentTime
    }

    // work on process
    process.totalTime -= 1

    // inc time counter
    currentTime += 1

    // add times for chart display
    const timeArray = new Array(processList.length).fill(null)
    // console.log("New array length: ", proc);
    timeArray[process.id - 1] = [currentTime - 1, currentTime]
    times.push(timeArray)

    // check if process is done
    if (process.totalTime === 0) {
      process.completionTime = currentTime
      process.turnaroundTime = process.completionTime - process.arrivalTime
      process.waitingTime = process.turnaroundTime - process.burstTime
      process.responseTime = process.startTime - process.arrivalTime

      // mark as completed
      process.isCompleted = true

      // remove from queue
      queue.shift()

      // inc counter
      completed++
    }
  }
  return times
}


function showAverageTimes() {
  const turnaroundAvg = processList.reduce((acc, curr) => acc + curr.turnaroundTime, 0) / processList.length
  const waitingAvg = processList.reduce((acc, curr) => acc + curr.waitingTime, 0) / processList.length
  const responseAvg = processList.reduce((acc, curr) => acc + curr.responseTime, 0) / processList.length

  turnaroundSpan.innerHTML = turnaroundAvg
  waitingSpan.innerHTML = waitingAvg
  responseSpan.innerHTML = responseAvg

}

animateBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // display hidden elements
  displayHiddenElements();


  // SRTF algorithm
  const times = srtf()

  // update table with times
  updateTable();

  // calculate datasets
  const datasets = makeDatasets(times)

  // display avg times
  showAverageTimes()

  // setup
  const data = {
    labels: processList.map((process) => process.id),
    datasets: datasets,
  };

  // config
  let delayed;
  const config = {
    type: "bar",
    data,
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
      indexAxis: "y",
      scales: {
        y: {
          title: {
            display: true,
            text: "Proceso",
          },
          beginAtZero: true,
          stacked: true,
        },
        x: {
          title: {
            display: true,
            text: "tiempo",
          },
          stacked: false,
        },
      },
      animation: {
        onComplete: () => {
          delayed = true;
        },
        delay: (context) => {
          let delay = 0;
          if (
            context.type === "data" &&
            context.mode === " default" &&
            !delayed
          ) {
            delay = context.dataIndex * 300 + context.datasetIndex * 100;
          }
          return delay;
        },
      },
    },
  };

  const myChart = new Chart(document.getElementById("myChart"), config);
});

// render init block
// const myChart = new Chart(document.getElementById("myChart"), config);
