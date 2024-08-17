import Product from "../models/Product.js";
import ProductStat from "../models/ProductStat.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import getCountryIso3 from "country-iso-2-to-3";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    //Takes array of promises from async function of of resturning stats and combine into a single promise that resolves when all of the promises have been resolved
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const stat = await ProductStat.find({
          productId: product._id,
        });
        return {
          ...product._doc, //returning the original product information with product._doc along with the stats stored in productStats
          stat,
        };
      })
    );

    res.status(200).json(productsWithStats);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

//Client Side pagination
export const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "user" }).select("-password");
    res.status(200).json(customers);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

//Server side pagination
export const getTransactions = async (req, res) => {
  try {
    //sort should look like this: { "field":"userId","sort":"desc"}
    const { page = 1, pageSize = 20, sort = null, search = "" } = req.query;

    //format sort should look like {userId:-1}
    const generateSort = () => {
      const sortParsed = JSON.parse(sort); //frontend will send the sort value as a String so parsing it as an object
      const sortFormatted = {
        [sortParsed.field]: (sortParsed.sort = "asc" ? 1 : -1),
      };

      return sortFormatted;
    };
    //If sort exists then only call generateSort function
    const sortFormatted = Boolean(sort) ? generateSort() : {};

    const transactions = await Transaction.find({
      $or: [
        { cost: { $regex: new RegExp(search, "i") } }, //Search for the cost field
        { userId: { $regex: new RegExp(search, "i") } }, //Search for the userId field
      ],
    })
      .sort(sortFormatted) //this will sort the query
      .skip(page * pageSize) // skip to the proper page and pageSize
      .limit(pageSize); //limit to the pagesize of how many results we need

    const total = await Transaction.countDocuments({}); //gives the total count

    res.status(200).json({ transactions, total });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getGeograpahy = async (req, res) => {
  try {
    const users = await User.find();

    const mappedLocations = users.reduce((acc, { country }) => {
      const countryISO3 = getCountryIso3(country);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {}); //Return a object that has CountryISO3 code as key and the value will be the counted of users belonging to that country

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return {
          id: country,
          value: count,
        };
      }
    ); //Proper formatting of the data to send to the map API

    res.status(200).json(formattedLocations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
