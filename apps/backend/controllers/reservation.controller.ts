// Import the Hono Context type for the controller's `c` parameter
import type { Context } from "hono";
import { createReservation, getSingleReservationByBusinessSlug, getReservationsByBusinessSlug, updateReservation, updateReservationStatus } from "../services/reservation.service.js";
import { handleServiceResponse } from "../utils/service-response.js";

export async function getAllReservationsController(c: Context) {
  const business = c.get("business")
  const result = await getReservationsByBusinessSlug(business.id)
  return handleServiceResponse(c, result)

}

export async function getSingleReservationController(c: Context) {
  const business = c.get("business")
  const reservationId = c.req.param('reservationId');

  const result = await getSingleReservationByBusinessSlug(business.id, reservationId);
  return handleServiceResponse(c, result)
}

export async function createReservationController(c: Context) {
  const body = await c.req.json()
  const business = c.get("business")
  const result = await createReservation(business.id, body)
  return handleServiceResponse(c, result)

}

export async function updateReservationController(c: Context) {
  const business = c.get("business")
  const reservationId = c.req.param('reservationId')
  const body = await c.req.json()

  const result = await updateReservation(business.id, body, reservationId)
  return handleServiceResponse(c, result)
}


export async function updateReservationStatusController(c: Context) {
  const business = c.get("business")
  const reservationId = c.req.param('reservationId')
  const body = await c.req.json()
  const { reservationStatus, rejectionReason } = body

  const result = await updateReservationStatus(business.id, reservationId, reservationStatus, rejectionReason)
  return handleServiceResponse(c, result)
}