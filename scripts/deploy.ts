// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
	const [owner] = await ethers.getSigners();
	const HarvestForwarder = await ethers.getContractFactory(
		"HarvestForwarder"
	);
	const forwarder = await HarvestForwarder.deploy(
		owner.address,
		"0x660802Fc641b154aBA66a62137e71f331B6d787A"
	);

	await forwarder.deployed();

	console.log("Harvest Forwarder deployed to:", forwarder.address);

	// TODO: Verify contract on etherscan
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
