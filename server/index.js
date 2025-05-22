const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

// EXPRESS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    methods: ["GET", "POST"],
  })
);

// Connect to MongoDB
const mongoose = require("mongoose");
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");
    
    (async function () {
      const eventsCount = await events.countDocuments();
      totalEvents = eventsCount;
    })();
  } catch (error) {
    console.error("Failed to connect to MongoDB", error.message);
  }
}
main();

// Schemas
const events = require("./schemas/events");
const emails = require("./schemas/emails");

let totalEvents = 0;

// Endpoints
app.get("/events", async (req, res) => {
  const offset = parseInt(req.query.offset);

  if (!req.query.offset) {
    res.status(400).json({ error: "Offset is required" });
    return;
  }

  try {
    const eventsDetails = await events.find().skip(offset).limit(5);

    res.status(200).json({
      success: true,
      next:
        offset + 5 < totalEvents
          ? `${req.protocol}://${req.get("host")}/events/?offset=${offset + 5}`
          : null,
      events: eventsDetails,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/emails", async (req, res) => {
  const { email, ticket } = req.body;

  if (!email || !ticket) {
    res.status(400).json({ error: "Email and Tickets are required" });
    return;
  }

  try {
    const checkEmail = await emails.findOne({ email: email });

    if (checkEmail) {
      await emails.findOneAndUpdate(
        { email },
        { $push: { tickets: { ticketUrl: ticket, date: new Date() } } },
        { new: true }
      );
    } else {
      await emails.create({
        email,
        tickets: [{ ticketUrl: ticket, date: new Date() }],
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUPPETEER SCRAPER
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrapeEvents() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto("https://www.sydney.com/events");
  await page.waitForSelector(".product-list-domestic.is_ready.map_not_open", {
    timeout: 10000,
  });

  const scrapedEvents = await page.evaluate(() => {
    const eventElements = document.querySelectorAll(
      ".product-list-domestic.is_ready.map_not_open .grid-item.product-list-widget.tile__product-list"
    );

    return Array.from(eventElements).map((el) => ({
      title: el.querySelector("h3")?.innerText.trim(),
      initialLink: el.querySelector("a")?.href,
      date: el.querySelector(".product__list-date")?.innerText || "No date",
      image: el.querySelector(".img-responsive")?.src,
      description: el.querySelector(".prod-desc")?.innerText,
      location: el.querySelector(".tile__area-name")?.innerText,
    }));
  });

  let finalEvents = [];
  for (const event of scrapedEvents) {
    try {
      const eventPage = await browser.newPage();
      await eventPage.goto(event.initialLink, { waitUntil: "networkidle2" });

      const ticketLink = await eventPage.evaluate(() => {
        const link = document.querySelector(
          ".atdw-inpage__cta.has-booking .btn.btn__cta__with-price"
        )?.href;
        return link || null;
      });

      finalEvents.push({
        ...event,
        link: ticketLink || event.initialLink,
      });

      await eventPage.close();
    } catch (err) {
      console.error("Failed to get final link for event:", event.title, err);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  await browser.close();

  if (!finalEvents.length) {
    console.log("No events found");
    return;
  }

  // Clear old events
  await events.deleteMany({});
  console.log("Deleted previous stored events");

  // Save new ones
  await events.insertMany(finalEvents);
  console.log(`Scraped & inserted ${finalEvents.length} events`);

  (async function () {
    const eventsCount = await events.countDocuments();
    totalEvents = eventsCount;
  })();
}
scrapeEvents();

// SCHEDULER
const cron = require("node-cron");
cron.schedule("0 */5 * * *", scrapeEvents); // every 5 hours

// SERVER START
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
