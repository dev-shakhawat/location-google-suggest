 "use client";

 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { MapPin } from "lucide-react";
 import { useEffect, useRef, useState } from "react";
 import { useForm, SubmitHandler } from "react-hook-form";

 interface BookingFormValues {
   user_address: string;
   latitude: string | null;
   longitude: string | null;
 }

 interface Location {
   address: string;
   latitude: number | null;
   longitude: number | null;
 }

 const LocationBox: React.FC<{ setData:  (data: Location) => void }> = ({ setData }) => {
   const [pickupLocation, setPickupLocation] = useState<Location>({
     address: "",
     latitude: null,
     longitude: null,
   });

   useEffect(() => {
     setData(pickupLocation);
   }, [pickupLocation]);
   

   const pickupInputRef = useRef<HTMLInputElement | null>(null);

   const {
     register,
     handleSubmit,
     setValue,
     formState: { errors, isSubmitted },
   } = useForm<BookingFormValues>();

   const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === "Enter") e.preventDefault();
   };

   const handleGetLocation = async () => {
     if (!navigator.geolocation) { 
       return;
     }

     navigator.geolocation.getCurrentPosition(
       async (position) => {
         const { latitude, longitude } = position.coords;

         if (!latitude || !longitude) { 
           return;
         }

         setPickupLocation({ address: "", latitude, longitude });
         setValue("latitude", latitude.toString());
         setValue("longitude", longitude.toString()); 

         try {
           const response = await fetch(
             `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
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
         }
       },
       (err) => {
         console.error(err); 
       }
     );
   };

   useEffect(() => {
     const initAutocomplete = () => {
       if (
         typeof window === "undefined" ||
         !window.google ||
         !window.google.maps ||
         !window.google.maps.places ||
         !pickupInputRef.current
       )
         return;

       const autocomplete = new window.google.maps.places.Autocomplete(
         pickupInputRef.current,
         {
           types: ["geocode"],
           fields: ["formatted_address", "geometry", "name", "place_id"],
         }
       );

       autocomplete.addListener("place_changed", () => {
         const place = autocomplete.getPlace();
         if (place && place.geometry && place.geometry.location) {
           const loc: Location = {
             address: place.formatted_address || place.name || "",
             latitude: place.geometry.location.lat(),
             longitude: place.geometry.location.lng(),
           };
           setPickupLocation(loc);
           setValue("user_address", loc.address);
           setValue("latitude", loc.latitude?.toString() || null);
           setValue("longitude", loc.longitude?.toString() || null);
         } else {
           console.warn("Selected place has no geometry/location.");
         }
       });
     };

     if (
       typeof window !== "undefined" &&
       window.google &&
       window.google.maps &&
       window.google.maps.places
     ) {
       initAutocomplete();
       return;
     }

     if (
       typeof window !== "undefined" &&
       !document.getElementById("gmaps-places")
     ) {
       const script = document.createElement("script");
       script.id = "gmaps-places";
       script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
       script.async = true;
       script.defer = true;
       script.onload = initAutocomplete;
       document.head.appendChild(script);
     }
   }, [setValue]);

   const onSubmit: SubmitHandler<BookingFormValues> = (data) => {
     console.log("Booking Data:", data); 
   };

   return (
     <section className="booking-section">
       <div className="section-padding-x">
         <form className="booking-form" onSubmit={handleSubmit(onSubmit)}>
           <div className="form-input-wrapper">
             <label className="form-label">Service Area/Location *</label>
             <div className="input-container">
               {(() => {
                 const { ref, ...rest } = register("user_address", {
                   required: "This field is required",
                 });
                 return (
                   <div className="flex gap-2 ">
                     <Input
                       placeholder="Type your location here..."
                       className="bg-white h-12 flex-1  "
                       type="text"
                       autoComplete="off"
                       {...rest}
                       ref={(el) => {
                         ref(el);
                         pickupInputRef.current = el;
                       }}
                       onKeyDown={preventEnterSubmit}
                     />

                     {/* button */}
                     <Button
                       type="button"
                       className="px-4 py-6 w-full md:w-auto"
                       onClick={handleGetLocation}
                     >
                       <MapPin className="size-6" /> Usar Mi Ubicación Actual
                     </Button>
                   </div>
                 );
               })()}
             </div>
           </div>
         </form>
       </div>
     </section>
   );
 };

 export default LocationBox;
