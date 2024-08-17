import express from "express";
import {
  getProducts,
  getCustomers,
  getTransactions,
  getGeograpahy,
} from "../controllers/client.js";

const router = express.Router();

console.log(router);

router.get("/products", getProducts);
router.get("/customers", getCustomers);
router.get("/transactions", getTransactions);
router.get("/geography", getGeograpahy);

export default router;
