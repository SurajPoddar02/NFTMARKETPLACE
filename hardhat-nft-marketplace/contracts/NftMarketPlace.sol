// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketPlace_PriceMustBeAboveZero();
error NftMarketPlace_NotApprovedForMarketPlace();
error NftMarketPlace_AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace_NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace_NotOwner();
error NftMarketPlace_PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketPlace_NoProceeds();
error NftMarketPlace_TransferFailed();

contract NftMarketPlace is ReentrancyGuard{


  /*
     * @notice Method for listing NFT
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param price sale price for each item
     */
  struct Listing {
    uint256 price ;
    address seller;
  }

  // Nft contract address-> nft toekn id -> Listing
  mapping(address => mapping(uint256 => Listing)) private s_listings;

  //seller address -> Amount earned
  mapping(address => uint256) private s_proceeds;

  event ItemBought(
    address indexed buyer,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemListed(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
    // Challenge : Have this contract accept the payment in a subset of token as well
    // Hint : use chainlink pricefeeds to convert the price of the token between each other
  );

  event ItemCanceled (
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId
  );
  // modifiers for checkingthat the listed events not listed again 
  modifier notListed(address nftAddress,uint256 tokenId,address owner) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if(listing.price > 0) {
        revert NftMarketPlace_AlreadyListed(nftAddress,tokenId);
    }
    _;
  }
  // nft listed here only owner can be listed of the nft so check isOwner
//   or is checking that only owner of that tikenid of nft can list it
  modifier isOwner(
   address nftAddress,
   uint tokenId,
   address spender
  ) {
    IERC721 nft = IERC721(nftAddress);
    address owner = nft.ownerOf(tokenId);
    if(spender != owner) {
        revert NftMarketPlace_NotOwner();
    }
    _;
  }
   modifier isListed(address nftAddress,uint256 tokenId) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if(listing.price <= 0) {
        revert NftMarketPlace_NotListed(nftAddress,tokenId);
    }
    _;
  }

  // not listed here to check the given nft and token id coresponding list is not alredy listed
  function listItem(
 address nftAddress,
   uint256 tokenId,
   uint256 price
  ) external 
  notListed(nftAddress,tokenId,msg.sender)
  isOwner(nftAddress, tokenId,msg.sender)
  {
if(price <= 0) {
    revert NftMarketPlace_PriceMustBeAboveZero();
}
//  two ways to list the nft items 
// 1. send the nft to the contract. transfer -> contract "hold " the nft
// 2. Owners can still hold their NFT, and give the market place approval

IERC721 nft = IERC721(nftAddress);
if(nft.getApproved(tokenId) != address(this)) {
    revert NftMarketPlace_NotApprovedForMarketPlace();
}
 s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
 emit ItemListed(msg.sender, nftAddress, tokenId, price);
  }


  function buyItem(address nftAddress, uint256 tokenId)
  external 
  payable 
  nonReentrant
  isListed(nftAddress,tokenId) {
    Listing memory listedItem = s_listings[nftAddress][tokenId];
   if(msg.value < listedItem.price) {
       revert NftMarketPlace_PriceNotMet(nftAddress,tokenId,listedItem.price);
   }
   s_proceeds[listedItem.seller] = msg.value + s_proceeds[listedItem.seller];
//    if person buy the nft delete it from the list
    delete(s_listings[nftAddress][tokenId]);
    // transferFrom function is being used to transfer ownership of the NFT with ID tokenId from the listedItem.seller to the msg.sender
    // use safeTransferfrom instead of transferfrom to validate that nft tranfer safely
    IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender,tokenId);
    emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    // Note : here we not just directly send the seller money why is that
    // we just wnat to user withdraw their money from the contract to avoid any issues
    // read from // https://fravoll.github.io/solidity-patterns/pull_over_push.html for more detail
  }
  function cancelListing(address nftAddress,uint tokenId) 
  external
  isOwner(nftAddress, tokenId, msg.sender)
  isListed(nftAddress, tokenId)
  {
     delete(s_listings[nftAddress][tokenId]);
     emit ItemCanceled(msg.sender, nftAddress, tokenId);
  }

  function updateListing (
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice
  ) external
  isListed(nftAddress, tokenId) 
  isOwner(nftAddress,tokenId,msg.sender) {
    s_listings[nftAddress][tokenId].price = newPrice;
    emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
  }
  function withdrawProceeds() external {
    uint256 proceeds = s_proceeds[msg.sender];
    if(proceeds <= 0) {
      revert NftMarketPlace_NoProceeds();
    }
    s_proceeds[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value:proceeds}("");

    if(!success) {
        revert NftMarketPlace_TransferFailed();
    }
  }

  function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory){
     return s_listings[nftAddress][tokenId];
  }
  function getProceeds(address seller) external view returns (uint256) {
    return s_proceeds[seller];
  }
  
}