import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, network } from "hardhat";
import ERC20 from "../abis/ERC20.json";

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

    it("Should allow owner to sweep funds in contract", async function () {
      const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
      const wbtcWhaleAccount = "0xB60C61DBb7456f024f9338c739B02Be68e3F545C";
      const distributeAmount = 1e8;
      // Impersonate an address to accidentally send funds to the forwarder
      const wBTC = new ethers.Contract(wbtcAddress, ERC20.abi);
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [wbtcWhaleAccount],
      });
      const [owner] = await ethers.getSigners();
      const wbtcWhale = await ethers.getSigner(wbtcWhaleAccount);

      const wbtcBalanceBefore = await wBTC
        .connect(owner)
        .balanceOf(forwarder.address);

      const wbtcBalanceOwnerBefore = await wBTC
        .connect(owner)
        .balanceOf(owner.address);

      const sendFunds = await wBTC
        .connect(wbtcWhale)
        .transfer(forwarder.address, distributeAmount);
      await sendFunds.wait();

      const wbtcBalanceAfterSend = await wBTC
        .connect(owner)
        .balanceOf(forwarder.address);
      expect(wbtcBalanceAfterSend).to.equal(
        wbtcBalanceBefore + distributeAmount
      );

      const sweep = await forwarder.connect(owner).sweep(wbtcAddress);
      await sweep.wait();

      const wbtcBalanceAfterSweep = await wBTC
        .connect(owner)
        .balanceOf(forwarder.address);
      const wbtcBalanceOwnerAfterSweep = await wBTC
        .connect(owner)
        .balanceOf(owner.address);
      expect(wbtcBalanceAfterSweep).to.equal(0);
      expect(wbtcBalanceOwnerAfterSweep).to.equal(
        wbtcBalanceOwnerBefore + distributeAmount
      );
    });
  });

  it("Should forward tokens to tree", async function () {
    const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const wbtcWhaleAccount = "0xB60C61DBb7456f024f9338c739B02Be68e3F545C";
    const distributeAmount = 1e8;
    const beneficiary = "0x19D97D8fA813EE2f51aD4B4e04EA08bAf4DFfC28";

    // Impersonate an address to send funds to the tree from
    const wBTC = new ethers.Contract(wbtcAddress, ERC20.abi);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [wbtcWhaleAccount],
    });
    const wbtcWhale = await ethers.getSigner(wbtcWhaleAccount);

    const treeBalanceBefore = await wBTC
      .connect(wbtcWhale)
      .balanceOf("0x660802Fc641b154aBA66a62137e71f331B6d787A");

    // approve and distribute funds
    const approveWbtc = await wBTC
      .connect(wbtcWhale)
      .approve(forwarder.address, distributeAmount);
    await approveWbtc.wait();
    const forwardFunds = await forwarder
      .connect(wbtcWhale)
      .distribute(wbtcAddress, distributeAmount, beneficiary);
    await forwardFunds.wait();

    const treeBalanceAfter = await wBTC
      .connect(wbtcWhale)
      .balanceOf("0x660802Fc641b154aBA66a62137e71f331B6d787A");

    const forwarderBalance = await wBTC
      .connect(wbtcWhale)
      .balanceOf(forwarder.address);

    // Confirm funds are in the tree and forwarder retains no funds.
    expect(treeBalanceAfter).to.equal(treeBalanceBefore + distributeAmount);
    expect(forwarderBalance).to.equal(0);
  });
});
