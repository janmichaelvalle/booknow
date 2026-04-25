import {Hono} from "hono";
import { getAllOfferingsController } from "../controllers/business.controller.js";

const app = new Hono ()


// Get packages, pricing, and add-ons
app.get("/api/businesses/:businessSlug/offerings", getAllOfferingsController);


export default app