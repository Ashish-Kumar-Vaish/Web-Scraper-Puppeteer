import React, { useState, useEffect } from "react";
import "./Events.css";
import Header from "../../components/header/Header";
import Card from "../../components/card/Card";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("");

  useEffect(() => {
    if (!events.length) {
      fetchEvents("http://localhost:8000/events?offset=0");
    }
  }, []);

  const fetchEvents = async (link) => {
    setLoading(true);

    const response = await fetch(link);
    const result = await response.json();

    if (result.success) {
      setEvents((prev) => [...prev, ...result.events]);
      setNext(result.next);
      console.log(result.next);
      setLoading(false);
    }
  };

  return (
    <div className="events">
      <Header />

      <div className="container">
        <div className="cardWrapper">
          {events.length ? (
            events.map((event, index) => {
              return <Card key={index} event={event} />;
            })
          ) : (
            <div className="noEvents">
              <h1>No events found :(</h1>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchEvents(next);
          }}
          className="loadMore"
          disabled={loading}
          type="button"
          style={next ? {} : { display: "none" }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>
    </div>
  );
};

export default Events;
