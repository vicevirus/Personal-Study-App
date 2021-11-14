const fs = require("fs");
const { Client, MessageMedia } = require("whatsapp-web.js");
window.$ = window.jQuery = require("jquery");
const SESSION_FILE_PATH = "./session.json";
const { app } = require("electron");

let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  session: sessionData,
  qrMaxRetries: 999999,
  qrRefreshIntervalMs: 63000,
});

let hasStarted = false;

$("#statusbox").show();
$("#logoutButton").hide();
$("#timerButton").hide();
$("#timer").hide();
$(".inputs").hide();

const now = Date.now();

timestamp = now + 30 * 60000;

console.log(timestamp);

function logoutWA() {
  $("#timerButton").hide();
  $(".inputs").hide();
  $("#logoutButton").hide();
  document.getElementById("statustext").innerHTML =
    "Logging out of your Whatsapp...";
  var fs = require("fs");
  var filePath = "./session.json";
  fs.unlinkSync(filePath);
  client.logout();

  var delayInMilliseconds = 5000; //1 second

  setTimeout(function () {
    location.reload();
  }, delayInMilliseconds);
}

// TIMER LOGIC

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
  info: {
    color: "green",
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD,
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD,
  },
};

function startButton() {
  hr = parseInt(document.getElementById("hr").value) * 3600;
  minutes = parseInt(document.getElementById("minutes").value) * 60;

  if (isNaN(hr)) {
    hr = 0;
  }
  if (isNaN(minutes)) {
    minutes = 0;
  }

  return hr + minutes;

  startTimer();
}

let TIME_LIMIT = 0;

let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

document.getElementById("timer").innerHTML = `
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label">${formatTime(
    timeLeft
  )}</span>
</div>
`;

function onTimesUp() {
  clearInterval(timerInterval);
}

function startTimer() {
  timePassed = 0;

  $("#logoutButton").hide();

  $(".inputs").hide();

  $("#statusbox").hide();

  $("#timer").fadeIn();

  TIME_LIMIT = startButton();
  console.log(TIME_LIMIT);

  hasStarted = true;
  document.getElementById("timerButton").innerHTML =
    '<button onclick="endTimer()" class="button is-danger is-rounded is-large">Stop</button>';
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;

    document.getElementById("base-timer-label").innerHTML =
      formatTime(timeLeft);

    setCircleDasharray();
    setRemainingPathColor(timeLeft);

    if (timeLeft === 0) {
      onTimesUp();
    }
  }, 1000);

  client.on("message", async (message) => {
    if (message.body == "!studytime") {
      message.reply(
        "Whats upp. I am studying rn. Be right back in" + secondsToHms(timeLeft)
      );
    }
  });
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " jam, " : " jam, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minit, " : " minit, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " saat" : " saat") : "";
  return hDisplay + mDisplay + sDisplay;
}

function endTimer() {
  if (hasStarted == true) {
    clearInterval(timerInterval);
    TIME_LIMIT = startButton();
    $("#timer").hide();
    $(".inputs").show();
    $("#logoutButton").show();
    $("#statusbox").show();
    document.getElementById("timerButton").innerHTML =
      '<button onclick="startTimer()" class="button is-info is-rounded is-large">Start</button>';
  }
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function setRemainingPathColor(timeLeft) {
  const { alert, warning, info } = COLOR_CODES;
  if (timeLeft <= alert.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(warning.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(alert.color);
  } else if (timeLeft <= warning.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(warning.color);
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} 283`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}

document.getElementById("statustext").innerHTML = "Loading..";

myinterval = setInterval(function () {
  location.reload();
}, 60000);

// CLIENT QR CONNECTION
client.on("qr", (qr) => {
  $(".lds-roller").hide();
  $("#statusbox").show();
  document.getElementById("statustext").innerHTML =
    "You have <b>1 minute</b> to scan this QR Code (Whatsapp Web)";
  console.log("QR RECEIVED", qr);
  new QRCode(document.getElementById("qrcode"), qr);
});

// IF CLIENT IS CONNECTED
client.on("ready", () => {
  console.log("Client is ready!");
  clearInterval(myinterval);
  document.getElementById("statustext").innerHTML =
    "How many hours do you wish to study?";
  $(".inputs").show();
  $("#qrcode").hide();
  $("#timerButton").show();
  $("#timer").hide();
  $("#logoutButton").show();
});

client.on("authenticated", (session) => {
  sessionData = session;
  $(".lds-roller").hide();
  clearInterval(myinterval);
  $("statusbox").show();
  document.getElementById("statustext").innerHTML =
    "How many hours do you wish to study?";
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});

client.initialize();
