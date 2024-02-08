let pollData=[]
let socket, pollChart;
$(document).ready(function () {
  socket = io();
  socket.on("connect", () => {
    console.log("connected socket");
  });
  socket.on("initialMessages", (messages) => {
    // Update the messages array with initial messages
    Alpine.store("global_store").pushMessages(messages);
  });
  socket.on("polls", (initialPolls) => {
    // Update the messages array with initial messages
    pollData = initialPolls;
    initChart();
  });
  socket.on("updatedPolls", (updatedPolls) => {
    // Update the messages array with initial messages
    pollData = updatedPolls;
    initChart();
  });
  socket.on("userTyping", () => {
    Alpine.store("global_store").setTyping(true);
  });
  socket.on("noUserTyping", () => {
    Alpine.store("global_store").setTyping(false);
  });
  // Listen for new messages from the server
  socket.on("newMessage", (message) => {
    // Add the new message to the messages array
    Alpine.store("global_store").pushMessage(message);
  });
  initChart();
});
const globalComponent = () => {
  return {
    tabName: "LOGIN",
    checkLogin() {
      if (localStorage.getItem("username")) {
        Alpine.store("global_store").login();
      }
    },
  };
};
const loginComponent = () => {
  return {
    username: "",
    login() {
      localStorage.setItem("username", this.username);
      Alpine.store("global_store").login();
    },
  };
};

const appComponent = () => {
  return {
    showResults: false,
    username: localStorage.getItem("username"),
    inputMessage: "",
    messages: [],
    isTyping: false,
    typingStartTimer: null,
    typingStopTimer: null,
    handleSubmit() {
      this.$refs.submitBtn.click();
      this.inputMessage = "";
      //   this.$refs.message.blur;
    },
    logout() {
      localStorage.removeItem("username");
      Alpine.store("global_store").logout();
    },
    submitMessage(e) {
      if (!this.username.trim() || !this.inputMessage.trim()) {
        alert("Please enter your name and message.");
        return;
      }
      socket.emit("newMessage", {
        id: Math.random().toString(36).substr(2, 9), // Generate a unique ID for the message
        username: this.username.trim(),
        content: this.inputMessage.trim(),
      });
    },
    startTyping() {
      if (this.inputMessage.trim() !== "") {
        if (!this.isTyping) {
          socket.emit("startTyping", { username: this.username.trim() });
          this.isTyping = true;
        }
        if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
        this.typingStopTimer = setTimeout(() => {
          this.isTyping = false;
          socket.emit("stopTyping", { username: this.username.trim() });
        }, 1500); // Adjust the delay time as needed (e.g., 1000 milliseconds)
      }
    },
    pollFormSubmit() {
      const pollForm = this.$refs.pollForm;
      const pollOptionInput = pollForm.querySelector(
        "input[name='pollOptions']:checked"
      );
      if (pollOptionInput) {
        const pollOptionValue = pollOptionInput.value;
        pollData.find((pollOption) => pollOption.option === pollOptionValue)
          .votes++;
        pollChart.data.datasets[0].data = pollData.map(
          (pollOption) => pollOption.votes
        );
        pollChart.update();
        pollForm.reset();
        socket.emit("newVote", pollData);
      }
    },
  };
};
function rgbToRgba(rgb, alpha = 1) {
  return `rgba(${rgb
    .substring(rgb.indexOf("(") + 1, rgb.length - 1)
    .split(",")
    .join()}, ${alpha})`;
}
function initChart() {
  if (pollChart) {
    // If the chart instance exists, destroy it
    pollChart.destroy();
  }
  const ctx = document.getElementById("chart").getContext("2d");
  pollChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: pollData.map((pollOption) => pollOption.option),
      datasets: [
        {
          label: "Favorite Superheroes",
          data: pollData.map((pollOption) => pollOption.votes),
          backgroundColor: pollData.map((pollOption) =>
            rgbToRgba(pollOption.color, 0.75)
          ),
          borderWidth: 3,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true, // Start the y-axis at zero
        },
      },
      title: {
        display: true,
        text: "Favorite Superheroes",
        fontColor: "#333",
        fontSize: 20,
        padding: 20,
      },
      legend: {
        display: false,
      },
    },
  });
}
