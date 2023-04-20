const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
        let basicNft,basicNftContract,nftMarketplaceContract, nftMarketplace,deployer, user;
        const PRICE = ethers.utils.parseEther("0.1");
        const TOKEN_ID = 0;
        
        beforeEach(async function () {
         accounts = await ethers.getSigners() // could also do with getNamedAccounts
         deployer = accounts[0]
         user = accounts[1]
           await deployments.fixture(["all"]);
           nftMarketplaceContract = await ethers.getContract("NftMarketPlace");

           nftMarketplace = await nftMarketplaceContract.connect(deployer);
           basicNftContract = await ethers.getContract("BasicNft");
           basicNft = await basicNftContract.connect(deployer);
           await basicNft.mintNft();
          //   basicNft.approve(nftMarketplace.getAddress, TOKEN_ID);, the NFT owner is giving the nftMarketplace contract permission to transfer the NFT with ID TOKEN_ID on their behalf. This is a necessary step before the nftMarketplace contract can take custody of the NFT and list it for sale on the marketplace
           await basicNft.approve(nftMarketplace.address, TOKEN_ID);
})
  describe ("listitem", function () {
       it("emits an event after listing an item", async function () {
         expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
            "ItemListed"
         )
       })
       it("exclusively items that haven't been listed", async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID,PRICE);
        const error = "NftMarketPlace_AlreadyListed"
       await expect( nftMarketplace.listItem(basicNft.address, TOKEN_ID,PRICE)).to.be.revertedWith(error);
       })
       it("exclusively allows owners to list", async function () {
          nftMarketplace = nftMarketplaceContract.connect(user);
          await expect( nftMarketplace.listItem(basicNft.address, TOKEN_ID,PRICE)).to.be.revertedWith("NftMarketPlace_NotOwner");
       })
       it("needs approvals to list item", async function () {
        await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
        await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
        ).to.be.revertedWith("NftMarketPlace_NotApprovedForMarketPlace")
    })
    it("Updates listing with seller and price", async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
        const listing = await nftMarketplace.getListing(basicNft.address,TOKEN_ID);
        assert.equal(listing.seller,deployer.address);
        assert.equal(listing.price.toString(), PRICE.toString())
    })
       })
      describe("cancelListing", function () {
        
        it("reverts if there is no listing", async function () {
          
          await expect(
              nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketPlace_NotListed")
      })
      it("reverts if anyone but the owner tries to call" , async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
        nftMarketplace = nftMarketplaceContract.connect(user);
        await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketPlace_NotOwner");
      })
      it("emits event and removes listing", async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
        expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
            "ItemCanceled"
        )
        const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
        assert(listing.price.toString() == "0")
    })
      })
      describe("buyItem", function () {
        it("reverts if the price isnt met", async function () {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          // not reverted the price
        // await expect(
        //   nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: ethers.utils.parseEther("0.2")})
        // ).to.be.revertedWith("NftMarketPlace_PriceNotMet")
         await expect(
          nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
        ).to.be.revertedWith("NftMarketPlace_PriceNotMet")
      })
      it("reverts if the item isnt listed", async function () {
        await expect(
            nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
        ).to.be.revertedWith("NftMarketPlace_NotListed")
    })
    it("transfers the nft to the buyer and updates internal proceeds record", async function () {
      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
      nftMarketplace = nftMarketplaceContract.connect(user)
      expect(
          await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
      ).to.emit("ItemBought")
      const newOwner = await basicNft.ownerOf(TOKEN_ID)
      const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
      assert(newOwner.toString() == user.address)
      assert(deployerProceeds.toString() == PRICE.toString())
  })
    })
    describe("updateListing", function () {
      it("must be owner and listed", async function () {
          await expect(
              nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketPlace_NotListed")
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          nftMarketplace = nftMarketplaceContract.connect(user)
          await expect(
              nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketPlace_NotOwner")
      })
      it("updates the price of the item", async function () {
          const updatedPrice = ethers.utils.parseEther("0.2")
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          expect(
              await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)
          ).to.emit("ItemListed")
          const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          assert(listing.price.toString() == updatedPrice.toString())
      })
  })
  describe("withdrawProceeds", function () {
    it("doesn't allow 0 proceed withdrawls", async function () {
        await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith("NftMarketPlace_NoProceeds")
    })
    it("withdraws proceeds", async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
        nftMarketplace = nftMarketplaceContract.connect(user)
        await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
        nftMarketplace = nftMarketplaceContract.connect(deployer)

        const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
        const deployerBalanceBefore = await deployer.getBalance()
        const txResponse = await nftMarketplace.withdrawProceeds()
        const transactionReceipt = await txResponse.wait(1)
        const { gasUsed, effectiveGasPrice } = transactionReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)
        const deployerBalanceAfter = await deployer.getBalance()

        assert(
            deployerBalanceAfter.add(gasCost).toString() ==
                deployerProceedsBefore.add(deployerBalanceBefore).toString()
        )
    })
  })
  })
       
    
