const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cron = require("node-cron");
require("dotenv").config();

const events = require("./schemas/events");
const emails = require("./schemas/emails");

const app = express();
puppeteer.use(StealthPlugin());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    methods: ["GET", "POST"],
  })
);

let totalEvents = 0;

// Scraper Function
async function scrapeEvents() {
  console.log("Starting event scraping...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  try {
    await page.goto("https://www.sydney.com/events", {
      waitUntil: "domcontentloaded",
    });
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
          return (
            document.querySelector(
              ".atdw-inpage__cta.has-booking .btn.btn__cta__with-price"
            )?.href || null
          );
        });

        finalEvents.push({
          ...event,
          link: ticketLink || event.initialLink,
        });

        await eventPage.close();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        console.error("Failed to get final link for event:", event.title, err);
      }
    }

    await browser.close();

    if (!finalEvents.length) {
      console.log("No events found.");
      return;
    }

    // Delete old events
    await events.deleteMany({});
    console.log("Old events deleted.");

    // Insert new events
    await events.insertMany(finalEvents);
    totalEvents = await events.countDocuments();

    console.log(`Scraped & inserted ${finalEvents.length} events.`);
  } catch (error) {
    console.error("Error during scraping:", error.message);
    await browser.close();
  }
}

// MongoDB Connection + App Init
const port = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Initial event count
    totalEvents = await events.countDocuments();

    await scrapeEvents();
    cron.schedule("0 */5 * * *", scrapeEvents); // Every 5 hours

    // Start the server
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });

// GET /events
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

// POST /emails
app.post("/emails", async (req, res) => {
  const { email, ticket } = req.body;

  if (!email || !ticket) {
    res.status(400).json({ error: "Email and Tickets are required" });
    return;
  }

  try {
    const checkEmail = await emails.findOne({ email });

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
