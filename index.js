const express = require("express");
const connectToDatabase = require("./database");
const order = require("./models/data");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to the database
connectToDatabase();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: [`${process.env.frontUrl}`], credentials: true }));

// Test route
app.get("/test", (req, res) => {
  console.log("Successfully tested");
  res.send("Successfully tested");
});

// Route to handle completed status
app.post("/sendMessage/completed", async (req, res) => {
  const { id, status, billing } = req.body;
  const recipientName = billing.first_name;
  const recipientNumber = billing.phone;
  console.log("completed Api is triggered");
  try {
    const existingUid = await order.findOne({ uid: id });

    if (!existingUid) {
      return res.status(404).send(`The UID ${id} does not exist.`);
    }

    if (status === "completed") {
      await order.findOneAndUpdate({ uid: id }, { completed: true });

      const apiUrl = "https://backend.api-wa.co/campaign/engagebird.com/api/v2";
      const requestBody = {
        apiKey: process.env.API_KEY,
        campaignName: process.env.Confirmation_CAMPAIGN_NAME,
        destination: `+91${recipientNumber}`,
        userName: recipientName,
        source: "website",
      };

      const response = await axios.post(apiUrl, requestBody);

      if (response.status === 200) {
        console.log("Message sent successfully:", response.data);
        res
          .status(200)
          .send(`Message sent successfully. Current status: ${status}`);
      } else {
        console.log("Failed to send message:", response.status, response.data);
        res
          .status(500)
          .send(`Failed to send message. Current status: ${status}`);
      }
    } else {
      res.status(400).send(`Status ${status} is not valid for this operation.`);
    }
  } catch (error) {
  console.error("Error processing request:", error);
  res.status(500).send("Server error: " + error.message);
}
});

// Route to handle pending status
app.post("/sendMessage/pending", async (req, res) => {
  const { id, status, billing } = req.body;
  const recipientName = billing.first_name;
  const recipientNumber = billing.phone;
  console.log("pending Api is triggered");
  if (status === "pending") {
    const newData = new order({ uid: id, pending: true });

    try {
      const savedData = await newData.save();
      console.log("Data created:", savedData);

      // Wait for 1 hour
      await new Promise((resolve) => setTimeout(resolve, 3600000));
      // Wait for 5 minutes (300,000 milliseconds)
      //await new Promise((resolve) => setTimeout(resolve, 300000));

      const isCompleted = await order.findOne({ uid: id });

      if (isCompleted && isCompleted.completed === false) {
        const apiUrl =
          "https://backend.api-wa.co/campaign/engagebird.com/api/v2";
        const requestBody = {
          apiKey: process.env.API_KEY,
          campaignName: process.env.Abandoned_CAMPAIGN_NAME,
          destination: `+91${recipientNumber}`,
          userName: recipientName,
          source: "website",
        };

        const response = await axios.post(apiUrl, requestBody);

        if (response.status === 200) {
          console.log("Message sent successfully:", response.data);
          res
            .status(200)
            .send(`Message sent successfully. Current status: ${status}`);
        } else {
          console.log(
            "Failed to send message:",
            response.status,
            response.data
          );
          res
            .status(500)
            .send(`Failed to send message. Current status: ${status}`);
        }
      } else {
        res
          .status(400)
          .send(
            `Status is not pending or order with ID ${id} is already completed.`
          );
      }
    } catch (error) {
      console.error("Error creating data:", error);
      res.status(500).send(`Error creating data. Current status: ${status}`);
    }
  } else {
    res.status(400).send(`Status ${status} is not valid for this operation.`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
