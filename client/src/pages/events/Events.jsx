import React, { useState, useEffect, useCallback } from "react";
import "./Events.css";
import Header from "../../components/header/Header";
import Card from "../../components/card/Card";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("");
  const [columnCount, setColumnCount] = useState(getColumnCount());

  // get the current column count based on the window width
  function getColumnCount() {
    const width = window.innerWidth;
    if (width < 600) return 1;
    if (width < 900) return 2;
    return 3;
  }

  // adjust the layout
  const handleResize = useCallback(() => {
    setColumnCount(getColumnCount());
  }, []);

  // Set up the resize event listener
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Fetch events when the component mounts
  useEffect(() => {
    if (!events.length) {
      fetchEvents("http://localhost:8000/events?offset=0");
    }
  }, [events]);

  // Fetch more events
  const fetchEvents = async (link) => {
    setLoading(true);
    const response = await fetch(link);
    const result = await response.json();

    if (result.success) {
      setEvents((prev) => [...prev, ...result.events]);
      setNext(result.next);
      setLoading(false);
    }
  };

  // chunk events into columns
  const distributeToColumns = (items, columns) => {
    const distributed = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => {
      distributed[index % columns].push(item);
    });
    return distributed;
  };

  return (
    <div className="events">
      <Header />

      <div className="container">
        <div className="cardWrapper">
          {distributeToColumns(events, columnCount).map(
            (columnEvents, colIdx) => (
              <div className="masonry-column" key={colIdx}>
                {columnEvents.map((event, i) => (
                  <Card key={`${colIdx}-${i}`} event={event} />
                ))}
              </div>
            )
          )}
        </div>

        <button
          onClick={() => fetchEvents(next)}
          className="loadMore"
          disabled={loading}
          style={next ? {} : { display: "none" }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>
    </div>
  );
};

export default Events;
