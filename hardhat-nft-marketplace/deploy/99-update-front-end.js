const { ethers,network } = require("hardhat");
const fs = require("fs");
const frontEndContractFile = "../nextjs-nft-marketplace/constants/networkMapping.json"
const frontEndAbiLocation = "../nextjs-nft-marketplace/constants/"
module.exports = async function() {
    if(process.env.UPDATE_FRONT_END) {
        console.log("Updating Frontend");
        // await UpdateContractAddresses();
        await updateAbi();
    }
}
async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketPlace");
    fs.writeFileSync(`${frontEndAbiLocation}NftMarketPlace.json`, nftMarketplace.interface.format(ethers.utils.FormatTypes.json))
    const basicNft = await ethers.getContract("BasicNft");
    fs.writeFileSync(`${frontEndAbiLocation}BasicNft.json`, basicNft.interface.format(ethers.utils.FormatTypes.json))
    // command 
    // yarn hardhat deploy --tags frontend --network localhost

}
async function UpdateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NftMarketPlace");
    const chainId = network.config.chainId.toString();
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractFile, "utf8"))

    if(chainId in contractAddresses) {
        if(!contractAddresses[chainId]["NftMarketPlace"].includes(nftMarketplace)) {
            contractAddresses[chainId]["NftMarketPlace"].push(nftMarketplace);
        }
    } else {
        contractAddresses[chainId] = {NftMarketPlace:[nftMarketplace.address]};
    }
    fs.writeFileSync(frontEndContractFile,JSON.stringify(contractAddresses));
}
module.exports.tags = ["all", "frontend"];