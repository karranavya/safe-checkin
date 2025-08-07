import { useState, useCallback } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nationalities } from "@/lib/nationalities";

import { validateUniqueness, checkGuestByRoom } from "@/api/guestApi";

const guestDetailsSchema = z
  .object({
    // Section 1: Basic Guest Information
    nationality: z.string({ required_error: "Please select a nationality." }),
    phone: z.string().min(1, "Phone number is required."),
    roomNumber: z.string().min(1, "Room number is required."),
    purpose: z.string({ required_error: "Please select a purpose of visit." }),
    guestCount: z.coerce
      .number({ required_error: "Number of guests is required." })
      .min(1, "At least one guest is required."),
    adultGuests: z.coerce.number().min(0, "Cannot be negative.").default(0),
    childGuests: z.coerce.number().min(0, "Cannot be negative.").default(0),
    infantGuests: z.coerce.number().min(0, "Cannot be negative.").default(0),

    referenceNumber: z.string().optional(),

    // Section 2: Booking Mode
    bookingMode: z.string({ required_error: "Please select booking mode." }),
    bookingWebsite: z.string().optional(),

    // Section 3: Stay Information
    checkInDateTime: z.date({
      required_error: "Check-in date & time is required.",
    }),
    checkOutDateTime: z.date({
      required_error: "Check-out date & time is required.",
    }),
    lengthOfStay: z.coerce
      .number()
      .min(1, "Length of stay must be at least 1 night."),
  })
  .refine(
    (data) =>
      data.guestCount ===
      (data.adultGuests ?? 0) +
        (data.childGuests ?? 0) +
        (data.infantGuests ?? 0),
    {
      message: "Guest segregation must add up to total guests.",
      path: ["guestCount"],
    }
  )
  .refine((data) => data.checkOutDateTime > data.checkInDateTime, {
    message: "Check-out date must be after check-in date.",
    path: ["checkOutDateTime"],
  })
  .refine(
    (data) => {
      if (data.bookingMode === "Online" && !data.bookingWebsite) {
        return false;
      }
      return true;
    },
    {
      message: "Booking source name is required for online bookings.",
      path: ["bookingWebsite"],
    }
  );

type GuestDetailsFormValues = z.infer<typeof guestDetailsSchema>;

const GuestDetailsForm = ({
  onNext,
  formData,
}: {
  onNext: (data: GuestDetailsFormValues) => void;
  formData?: Partial<GuestDetailsFormValues>;
}) => {
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isValidating, setIsValidating] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Helper function to get default check-out date (next day at 11 AM)
  const getDefaultCheckOutDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0); // Set to 11:00 AM
    return tomorrow;
  };

  const form = useForm<GuestDetailsFormValues>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      nationality: formData?.nationality || "",
      phone: formData?.phone || "",
      roomNumber: formData?.roomNumber || "",
      purpose: formData?.purpose || "",
      guestCount: formData?.guestCount ?? 1,
      adultGuests: formData?.adultGuests ?? 0,
      childGuests: formData?.childGuests ?? 0,
      infantGuests: formData?.infantGuests ?? 0,
      bookingWebsite: formData?.bookingWebsite || "",
      referenceNumber: formData?.referenceNumber || "",
      bookingMode: formData?.bookingMode || "",

      checkInDateTime: formData?.checkInDateTime || new Date(), // Current date and time
      checkOutDateTime: formData?.checkOutDateTime || getDefaultCheckOutDate(), // Next day at 11 AM
      lengthOfStay: formData?.lengthOfStay ?? 1,
    },
  });

  const watchedValues = form.watch();

  // Debounced validation function - FIXED VERSION
  const validateUniquenessField = useCallback(
    async (field: string, value: string) => {
      if (!value || value.trim() === "") {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      setIsValidating((prev) => ({ ...prev, [field]: true }));

      try {
        let result;

        // Map form fields to API parameters
        switch (field) {
          case "phone":
            result = await validateUniqueness({ phone: value });
            break;
          case "roomNumber":
            // Check if room is occupied
            try {
              const roomCheck = await checkGuestByRoom(value);
              result = {
                isUnique: roomCheck.count === 0,
                conflictType: roomCheck.count > 0 ? "room" : null,
                existingGuest: roomCheck.data?.[0] || null,
              };
            } catch (error) {
              console.error("Room check error:", error);
              result = { isUnique: true }; // Assume room is available if check fails
            }
            break;
          default:
            // For other fields, assume they're unique
            result = { isUnique: true };
        }

        if (!result.isUnique) {
          let errorMessage = "";

          switch (result.conflictType) {
            case "phone":
              errorMessage = `Phone number already exists for ${result.existingGuest?.name} in room ${result.existingGuest?.roomNumber}`;
              break;
            case "room":
              errorMessage = `Room ${value} is already occupied by ${result.existingGuest?.name}`;
              break;
            default:
              errorMessage = `${field} already exists`;
          }

          setValidationErrors((prev) => ({
            ...prev,
            [field]: errorMessage,
          }));

          form.setError(field as any, {
            type: "manual",
            message: errorMessage,
          });
        } else {
          setValidationErrors((prev) => ({ ...prev, [field]: "" }));
          form.clearErrors(field as any);
        }
      } catch (error) {
        console.error("Validation error:", error);
        setValidationErrors((prev) => ({
          ...prev,
          [field]: "Unable to validate. Please try again.",
        }));
      } finally {
        setIsValidating((prev) => ({ ...prev, [field]: false }));
      }
    },
    [form]
  );

  // Debounce helper
  const useDebounce = (callback: Function, delay: number) => {
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
      null
    );

    return useCallback(
      (...args: any[]) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        const newTimer = setTimeout(() => {
          callback(...args);
        }, delay);

        setDebounceTimer(newTimer);
      },
      [callback, delay, debounceTimer]
    );
  };

  // FIXED: Use the correct validation function
  const debouncedValidateRoom = useDebounce(
    (value: string) => validateUniquenessField("roomNumber", value),
    800
  );

  const debouncedValidatePhone = useDebounce(
    (value: string) => validateUniquenessField("phone", value),
    800
  );

  // Watch for changes in critical fields
  useEffect(() => {
    if (watchedValues.roomNumber) {
      debouncedValidateRoom(watchedValues.roomNumber);
    }
  }, [watchedValues.roomNumber, debouncedValidateRoom]);

  useEffect(() => {
    if (watchedValues.phone) {
      debouncedValidatePhone(watchedValues.phone);
    }
  }, [watchedValues.phone, debouncedValidatePhone]);

  // Auto-calculate length of stay when dates change
  const calculateLengthOfStay = () => {
    const checkIn = watchedValues.checkInDateTime;
    const checkOut = watchedValues.checkOutDateTime;
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      form.setValue("lengthOfStay", diffDays);
    }
  };

  // Update calculations when relevant fields change
  useEffect(() => {
    calculateLengthOfStay();
  }, [watchedValues.checkInDateTime, watchedValues.checkOutDateTime]);

  const onInvalid = (errors: any) => {
    const fields = Object.keys(errors);
    setShakeFields(fields);
    setTimeout(() => setShakeFields([]), 820);
  };

  // FIXED: Corrected onSubmit function
  const onSubmit = async (data: GuestDetailsFormValues) => {
    // Check if there are any validation errors
    const hasValidationErrors = Object.values(validationErrors).some(
      (error) => error !== ""
    );

    if (hasValidationErrors) {
      // Shake the fields with errors
      const errorFields = Object.keys(validationErrors).filter(
        (key) => validationErrors[key] !== ""
      );
      setShakeFields(errorFields);
      setTimeout(() => setShakeFields([]), 820);
      return;
    }

    // Final validation before submit
    try {
      const validationPromises = [];

      // Check phone uniqueness
      if (data.phone) {
        validationPromises.push(
          validateUniqueness({ phone: data.phone }).then((result) => ({
            field: "phone",
            isValid: result.isUnique,
            message: result.isUnique
              ? ""
              : `Phone number already exists for ${result.existingGuest?.name}`,
            result,
          }))
        );
      }

      // Check room availability
      if (data.roomNumber) {
        validationPromises.push(
          checkGuestByRoom(data.roomNumber).then((roomCheck) => ({
            field: "roomNumber",
            isValid: roomCheck.count === 0,
            message:
              roomCheck.count > 0
                ? `Room ${data.roomNumber} is already occupied`
                : "",
            result: { isUnique: roomCheck.count === 0 },
          }))
        );
      }

      const validationResults = await Promise.all(validationPromises);
      const invalidResults = validationResults.filter((r) => !r.isValid);

      if (invalidResults.length > 0) {
        // Handle conflicts
        invalidResults.forEach((invalidResult) => {
          form.setError(invalidResult.field as any, {
            type: "manual",
            message: invalidResult.message,
          });
        });

        const errorFields = invalidResults.map((r) => r.field);
        setShakeFields(errorFields);
        setTimeout(() => setShakeFields([]), 820);
        return;
      }
    } catch (error) {
      console.error("Final validation error:", error);
      alert("Unable to validate data. Please try again.");
      return;
    }

    onNext(data);
  };

  const formatDateTimeLocal = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .shake {
          animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        }
        [aria-invalid="true"] {
            border-color: hsl(var(--destructive));
        }
        select[aria-invalid="true"] ~ button {
            border-color: hsl(var(--destructive));
        }
        .validation-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          {/* Section 1: Basic Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("nationality") ? "shake" : ""
                      }
                    >
                      <FormLabel>Nationality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nationalities.map((n) => (
                            <SelectItem key={n.value} value={n.value}>
                              {n.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem
                      className={shakeFields.includes("phone") ? "shake" : ""}
                    >
                      <FormLabel>
                        Phone Number
                        {isValidating.phone && (
                          <span className="validation-spinner"></span>
                        )}
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Enter phone number"
                            className={`flex-grow ${
                              validationErrors.phone ? "border-red-500" : ""
                            }`}
                            {...field}
                          />
                        </FormControl>
                        <Button type="button" variant="secondary">
                          Send OTP
                        </Button>
                      </div>
                      {validationErrors.phone ? (
                        <p className="text-sm text-red-600">
                          {validationErrors.phone}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("roomNumber") ? "shake" : ""
                      }
                    >
                      <FormLabel>
                        Room Number Allocated
                        {isValidating.roomNumber && (
                          <span className="validation-spinner"></span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 101"
                          className={
                            validationErrors.roomNumber ? "border-red-500" : ""
                          }
                          {...field}
                        />
                      </FormControl>
                      {validationErrors.roomNumber ? (
                        <p className="text-sm text-red-600">
                          {validationErrors.roomNumber}
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem
                      className={shakeFields.includes("purpose") ? "shake" : ""}
                    >
                      <FormLabel>Purpose of Visit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="tourism">Tourism</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("guestCount") ? "shake" : ""
                      }
                    >
                      <FormLabel>Number of Guests</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Total guests"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div
                  className={`space-y-2 ${
                    shakeFields.some((f) =>
                      ["adultGuests", "childGuests", "infantGuests"].includes(f)
                    )
                      ? "shake"
                      : ""
                  }`}
                >
                  <FormLabel>Guest Segregation</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="adultGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Adults"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="childGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Children"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="infantGuests"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Infants"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BK123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Booking Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bookingMode"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("bookingMode") ? "shake" : ""
                      }
                    >
                      <FormLabel>Mode of Booking</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Direct">Direct</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Travel Agent">
                            Travel Agent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedValues.bookingMode === "Online" && (
                  <FormField
                    control={form.control}
                    name="bookingWebsite"
                    render={({ field }) => (
                      <FormItem
                        className={
                          shakeFields.includes("bookingWebsite") ? "shake" : ""
                        }
                      >
                        <FormLabel>Booking Website Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., MakeMyTrip, Goibibo, Booking.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Stay Information */}
          <Card>
            <CardHeader>
              <CardTitle>Stay Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="checkInDateTime"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("checkInDateTime") ? "shake" : ""
                      }
                    >
                      <FormLabel>Check-in Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value ? formatDateTimeLocal(field.value) : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOutDateTime"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("checkOutDateTime") ? "shake" : ""
                      }
                    >
                      <FormLabel>Check-out Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value ? formatDateTimeLocal(field.value) : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lengthOfStay"
                  render={({ field }) => (
                    <FormItem
                      className={
                        shakeFields.includes("lengthOfStay") ? "shake" : ""
                      }
                    >
                      <FormLabel>Length of Stay (nights)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Auto-calculated"
                          readOnly
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default GuestDetailsForm;
