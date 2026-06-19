import {Hono} from "hono";
import { getAllOfferingsController, getBusinessInformation } from "../controllers/business.controller.js";

const app = new Hono ()


// Get business name
app.get("/api/businesses/:businessSlug", getBusinessInformation)


// Get packages, pricing, and add-ons
app.get("/api/businesses/:businessSlug/offerings", getAllOfferingsController);


export default app