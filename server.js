const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const db = require("./database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const ALPHA_VANTAGE_API_KEY = "6D4MPJE3T7YP8SPN";
const SYMBOLS = ["AAPL", "GOOGL", "AMZN"];

async function fetchStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  try {
    const response = await axios.get(url);
    const data = response.data["Global Quote"];

    if (!data || !data["01. symbol"] || !data["05. price"]) {
      console.error(`Invalid data received for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: data["01. symbol"],
      price: parseFloat(data["05. price"]),
    };
  } catch (error) {
    console.error(
      `Error fetching stock data for symbol ${symbol}:`,
      error.message
    );
    return null;
  }
}

async function updateStockData() {
  for (let symbol of SYMBOLS) {
    const stockData = await fetchStockData(symbol);

    if (stockData) {
      const { symbol: stockSymbol, price } = stockData;

      db.run(
        `INSERT INTO stocks (symbol, price) VALUES (?, ?)`,
        [stockSymbol, price],
        (err) => {
          if (err) {
            console.error("Error inserting stock data:", err.message);
          }
        }
      );

      io.emit("stockData", stockData);
    }
  }
}

io.on("connection", (socket) => {
  console.log("New client connected");

  db.all(
    `SELECT symbol, price FROM stocks ORDER BY timestamp DESC LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return;
      }
      socket.emit("stockData", rows);
    }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

setInterval(updateStockData, 30000);

app.get("/api/stocks", (req, res) => {
  db.all(
    `SELECT symbol, price FROM stocks ORDER BY timestamp DESC LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

server.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
