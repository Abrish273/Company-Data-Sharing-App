const { format } = require("date-fns");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const { promisify } = require("util");
const path = require("path");
const fsPromises = {
  ...fs.promises,
  mkdir: promisify(fs.mkdir),
  appendFile: promisify(fs.appendFile),
  readFile: promisify(fs.readFile),
};
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvFilePath = path.join(__dirname, "logs.csv");

const csvWriter = createCsvWriter({
  path: csvFilePath,
  header: [
    { id: "timestamp", title: "Timestamp" },
    { id: "uuid", title: "UUID" },
    { id: "method", title: "Method" },
    { id: "url", title: "URL" },
    { id: "origin", title: "Origin" },
    { id: "ipAddress", title: "IP Address" },
    { id: "location", title: "Location" },
    { id: "userId", title: "User ID" },
    { id: "userEmail", title: "User Email" },
    { id: "isProxy", title: "Is Proxy" },
    { id: "requestBody", title: "Request Body" },
    { id: "responseStatusCode", title: "Response Status Code" },
    { id: "responseBody", title: "Response Body" },
    { id: "duration", title: "Duration (ms)" },
  ],
});

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "logs"));
    }

    // Append the log item to the log file
    await fsPromises.appendFile(
      path.join(__dirname, "logs", logFileName),
      logItem
    );

    // Append the log item to the CSV file
    await csvWriter.writeRecords([parseLogMessage(logItem)]);

    console.log("Log item saved to", logFileName);
  } catch (err) {
    console.error("Error saving log:", err);
  }
};

const parseLogMessage = (message) => {
  const [timestamp, uuidValue, ...rest] = message.split("\t");
  return { timestamp, uuid: uuidValue, ...rest.join("\t") };
};

const getLocation = async (ip) => {
  try {
    // Use an external service or database to get the location based on the IP address
    // For simplicity, this example assumes a fictional getLocation function
    return "Unknown location";
  } catch (error) {
    console.error("Error getting location:", error.message);
    return "Unknown location";
  }
};

const loggerMiddleware = (req, res, next) => {
  const startTimestamp = new Date();

  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const timestamp = startTimestamp.toISOString();
  const userAgent = req.get("user-agent");
  const method = req.method;
  const url = req.originalUrl;
  const headers = req.headers;
  const queryParameters = req.query;
  const requestBody =
    req.method === "POST" || req.method === "PUT" ? req.body : null;

  // Log incoming request information
  const requestLogMessage = `${timestamp}\tIP: ${ipAddress} | User-Agent: ${userAgent} | Method: ${method} | URL: ${url}`;
  logEvents(requestLogMessage, "logs.log");

  // Continue to the next middleware or route handler
  next();

  // Capture response details after the response is sent
  res.on("finish", async () => {
    const endTimestamp = new Date();
    const duration = endTimestamp - startTimestamp;
    const statusCode = res.statusCode;
    const responseBody = res.statusCode === 200 ? res.body : null; // Only log response body for successful requests

    // Log outgoing response information
    const responseLogMessage = `${endTimestamp.toISOString()}\tStatus Code: ${statusCode} | Duration: ${duration}ms`;
    logEvents(responseLogMessage, "logs.log");
  });
};

module.exports = {
  loggerMiddleware,
};
