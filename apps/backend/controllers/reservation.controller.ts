// Import the Hono Context type for the controller's `c` parameter
import type { Context } from "hono";
import { createReservation, getReservationsByBusinessSlug, updateReservation } from "../services/reservation.service.js";
import { getSingleReservationByBusinessSlug } from "../services/reservation.service.js";

export async function getAllReservationsController(c: Context) {
   // Read the businessSlug in the URL
  const businessSlug = c.req.param("businessSlug");

  // Get the reservations
  const result = await getReservationsByBusinessSlug(businessSlug);

  if ("error" in result) {
    return c.json(
      {
        message: result.error.message,
        error: result.error.details,
      },
      result.error.status
    );
  }

  return c.json({
    message: "success",
    data: result.data,
  });
}

export async function getSingleReservationController(c: Context) {
  const businessSlug = c.req.param("businessSlug");
  const reservationId = c.req.param('reservationId');

  // Get the reservations
  const result = await getSingleReservationByBusinessSlug(businessSlug, reservationId);

   if ("error" in result) {
    return c.json(
      {
        message: result.error.message,
        error: result.error.details,
      },
      result.error.status
    );
  }

  return c.json({
    message: "success",
    data: result.data,
  });
}

export async function createReservationController(c: Context) {
  const body = await c.req.json()
  const businessSlug = c.req.param("businessSlug")
  const result = await createReservation(businessSlug, body)

  if ("error" in result) {
    return c.json(
      {
        message: result.error.message,
        error: result.error.details,
      },
      result.error.status
    );
  }

  return c.json({
    message: "success",
    data: result.data,
  });

}

export async function updateReservationController(c: Context) {
  const businessSlug = c.req.param('businessSlug')
  const reservationId = c.req.param('reservationId')
  const body = await c.req.json()

  const result = await updateReservation(businessSlug, body, reservationId)

  if ("error" in result) {
    return c.json(
      {
        message: result.error.message,
        error: result.error.details,
      },
      result.error.status
    );
  }

  return c.json({
    message: "success",
    data: result.data,
  });

  
}