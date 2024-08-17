import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

export const getAdmins = async (req, res) => {
  try {
    const admin = await User.find({ role: "admin" }).select("-password");
    res.status(200).json(admin); //Grabbing the users who are admins but not showing their password
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } }, //We are getting the Id from params and converting it to the correct format and matching it finding the user
      //who has this particular id
      {
        $lookup: {
          from: "affiliatestats",
          localField: "_id",
          foreignField: "userId",
          as: "affiliateStats",
        },
      }, //looking up in affiliatestats model to find which of the affiliatestats are going to be referenced by the userId
      { $unwind: "$affiliateStats" }, //flattening of the object
    ]); //We will get current users with their normal information along with affiliateStats of the users

    const saleTransactions = await Promise.all(
      userWithStats[0].affiliateStats.affiliateSales.map((id) => {
        return Transaction.findById(id);
      })
    ); //Mapping through the affiliateSales of the user and finding the transactions by the transaction ID

    const filteredSaleTransactions = saleTransactions.filter(
      (transaction) => transaction !== null
    ); //Filtering the Transactions which doesnt have null

    res
      .status(200)
      .json({ user: userWithStats[0], sales: filteredSaleTransactions });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
