import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LocationBox = () => {
  const [pickupLocation, setPickupLocation] = useState({
    address: "",
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickupInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm();

  const preventEnterSubmit = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleGetLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          if (!latitude || !longitude) {
            setError("Failed to retrieve location.");
            return;
          }

          setPickupLocation({ address: "", latitude, longitude });
          setValue("latitude", latitude.toString());
          setValue("longitude", longitude.toString());
          setError(null);

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=your_google_map_api_here_paid_api`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const formattedAddress = data.results[0].formatted_address || "";
              setPickupLocation({
                address: formattedAddress,
                latitude,
                longitude,
              });
              setValue("user_address", formattedAddress);
            }
          } catch (err) {
            console.error(err);
            setError("Failed to fetch location details.");
          }
        },
        (err) => {
          console.error(err);
          setError("Failed to retrieve location.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
    };
    
    useEffect(() => {
      const initAutocomplete = () => {
        if (
          typeof window !== "undefined" &&
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          pickupInputRef.current
        ) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            pickupInputRef.current,
            {
              types: ["geocode"],
              fields: ["formatted_address", "geometry", "name", "place_id"],
            }
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry) {
              const loc = {
                address: place.formatted_address || place.name || "",
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
              };
              setPickupLocation(loc);
              setValue("user_address", loc.address);
              setValue("latitude", loc.latitude.toString());
              setValue("longitude", loc.longitude.toString());
            }
          });
        }
      };

      // যদি Google Maps API লোড হয়
      if (
        typeof window !== "undefined" &&
        window.google &&
        window.google.maps &&
        window.google.maps.places
      ) {
        initAutocomplete();
        return;
      }

      // নাহলে স্ক্রিপ্ট যোগ করুন
      if (
        typeof window !== "undefined" &&
        !document.getElementById("gmaps-places")
      ) {
        const script = document.createElement("script");
        script.id = "gmaps-places";
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=your_google_map_api_here_paid_api&libraries=places";
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
      }
    }, []);



  const onSubmit = (data) => {
    console.log("Booking Data:", data);
    toast.success("Booking submitted!");
  };

  return (
    <>
      <section className="booking-section">
        <div className="section-padding-x">
          <h2 className="section-title">Booking Form</h2>
          <form className="booking-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-input-wrapper">
              <label className="form-label">
                Current Location <span>*</span>
              </label>
              <div className="input-container">
                {(() => {
                  const { ref, ...rest } = register("user_address", {
                    required: "This field is required",
                  });
                  return (
                    <input
                      placeholder="Type to search location..."
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      {...rest}
                      ref={(el) => {
                        ref(el);
                        pickupInputRef.current = el;
                      }}
                      onKeyDown={preventEnterSubmit}
                    />
                  );
                })()}
                <button
                  type="button"
                  className="btn-custom w-100 form-btn"
                  onClick={handleGetLocation}
                >
                  Use Current location
                </button>
              </div>
              {pickupLocation.latitude && (
                <small className="text-success">
                  ✓ Coordinates captured: {pickupLocation.latitude?.toFixed(6)},{" "}
                  {pickupLocation.longitude?.toFixed(6)}
                </small>
              )}
              {isSubmitted && errors.user_address && (
                <span style={{ color: "red" }}>
                  {errors.user_address.message}
                </span>
              )}
            </div>

            <div className="form-input-wrapper">
              <button type="submit" className="btn-custom w-100 form-btn">
                {loading ? "Loading..." : "Submit Booking"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <ToastContainer />
    </>
  );
};

export default LocationBox;
