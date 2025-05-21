import React from "react";
import { useForm } from "react-hook-form";
import "./EmailPopup.css";

const EmailPopup = ({ eventUrl, onClose }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const optIn = watch("optIn", false);

  const onSubmit = async (data) => {
    try {
      const response = await fetch("http://localhost:8000/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, ticket: eventUrl }),
      });
      const result = await response.json();

      if (result.success) {
        window.open(eventUrl, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        alert("Failed to submit email. Try again.");
      }
    } catch (error) {
      alert("Error submitting email. Try again.");
    }
  };

  return (
    <div className="popupOverlay">
      <div className="popupContent">
        <button className="closeBtn" onClick={onClose}>
          &times;
        </button>

        <form onSubmit={handleSubmit(onSubmit)}>
          <label>Enter your email</label>
          <input
            type="email"
            placeholder="Email address"
            {...register("email", {
              required: { value: true, message: "Email is required." },
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <span className="error">{errors.email.message}</span>
          )}

          <label className="checkboxLabel">
            <input
              type="checkbox"
              {...register("optIn", {
                required: { value: true, message: "Opt-in is required." },
              })}
            />
            I agree to receive email updates and marketing communication.
          </label>
          {errors.optIn && (
            <span className="error">{errors.optIn.message}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || optIn === false}
            style={optIn === false ? { opacity: 0.5 } : {}}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailPopup;
