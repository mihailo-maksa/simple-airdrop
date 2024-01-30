import hre from "hardhat";
import { getLzEndpoint } from "../../utils/utils";
import dotenv from "dotenv";
dotenv.config();

export default [
  process.env.DEPLOYER_ADDRESS,
  "Simple OFT",
  "SOFT",
  getLzEndpoint(hre.network.name),
  1, // main chain id (replace with the chain id of the chain thay you want to make your base chain)
];
