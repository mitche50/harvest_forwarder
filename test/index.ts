import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("HarvestForwarder", function () {
	let owner: SignerWithAddress;
	let tree: string;
	let HarvestForwarder: ContractFactory;
	let forwarder: Contract;

	// `beforeEach` will run before each test, re-deploying the contract every
	// time. It receives a callback, which can be async.
	beforeEach(async function () {
		[owner] = await ethers.getSigners();
		tree = "0x660802Fc641b154aBA66a62137e71f331B6d787A";

		HarvestForwarder = await ethers.getContractFactory("HarvestForwarder");
		forwarder = await HarvestForwarder.deploy(owner.address, tree);
		await forwarder.deployed();
	});

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			expect(await forwarder.owner()).to.equal(owner.address);
		});

		it("Should set the correct badger tree address", async function () {
			expect(await forwarder.badger_tree()).to.equal(tree);
		});
	});

	describe("Admin functions", function () {
		it("Should return the new tree once it's changed", async function () {
			expect(await forwarder.badger_tree()).to.equal(tree);

			const setBadgerTree = await forwarder.set_tree(
				"0xbe82A3259ce427B8bCb54b938b486dC2aF509Cc3"
			);

			// wait until the transaction is mined
			await setBadgerTree.wait();

			expect(await forwarder.badger_tree()).to.equal(
				"0xbe82A3259ce427B8bCb54b938b486dC2aF509Cc3"
			);
		});
	});

	// it("Should forward tokens to tree", async function () {

	// })
});
