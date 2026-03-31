// Import the Hono Context type for the controller's `c` parameter
import type { Context } from "hono";
import { createReservation, getReservationsByBusinessSlug, updateReservation } from "../services/reservation.service.js";
import { getSingleReservationByBusinessSlug } from "../services/reservation.service.js";
import { handleServiceResponse } from "../utils/service-response.js";

export async function getAllReservationsController(c: Context) {
  const businessSlug = c.req.param("businessSlug");
  const result = await getReservationsByBusinessSlug(businessSlug);
  return handleServiceResponse(c, result)

}

export async function getSingleReservationController(c: Context) {
  const businessSlug = c.req.param("businessSlug");
  const reservationId = c.req.param('reservationId');

  const result = await getSingleReservationByBusinessSlug(businessSlug, reservationId);
  return handleServiceResponse(c, result)
}

export async function createReservationController(c: Context) {
  const body = await c.req.json()
  const businessSlug = c.req.param("businessSlug")
  
  const result = await createReservation(businessSlug, body)
  return handleServiceResponse(c, result)

}

export async function updateReservationController(c: Context) {
  const businessSlug = c.req.param('businessSlug')
  const reservationId = c.req.param('reservationId')
  const body = await c.req.json()

  const result = await updateReservation(businessSlug, body, reservationId)
  return handleServiceResponse(c, result)

  
}