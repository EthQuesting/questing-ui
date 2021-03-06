import ERC721s from '../assets/erc721s';
import ERC20s from '../assets/erc20s';
import abi721 from '../assets/erc721_abi';
import abi20 from '../assets/erc20_abi';

import CONTRACT from '../assets/contract';
// import bin_uint from "./bytecode/bin_uint"
// import abi_uint from "./abi/abi_uint"
// import bin_str from "./bytecode/bin_str"
// import abi_str from "./abi/abi_str"

import fakeNFT from '../assets/fakeNFT'


export async function setApproval(_web3, network, address, id, account) {
  let token_contract = await getContract(_web3, abi721, address)
  await token_contract.methods.approve(CONTRACT[network].address, id).send({from : account})
}

export async function setApprovalFor20(_web3, network, address, id, account) {
  try {
    let token_contract = await getContract(_web3, abi20, address)
    await token_contract.methods.approve(CONTRACT[network].address, id).call({from : account})
  } catch (err) {
    console.log(err);
  }
}

export async function getContract(_web3, abi, address) {
  // return new _web3.eth.Contract(abi, address);
  try {
    return new _web3.eth.Contract(abi, address);
  } catch (err) {
    console.log(err);
  }
}

export async function getBalancesForAll(network, account){
  let balanceData = {}
  // populate with keys and value []
  for (let key in ERC721s[network]){
    //use address as key and set balance array to empty
    balanceData[ERC721s[network][key].address] = []
  }
  // get all ERC721 assets owned by current account
  let query = 'https://rinkeby-api.opensea.io/api/v1/assets?owner='+account+'&api_key=e4f5e442e7664e3eb56fd7c415cf6128'
  let res = false
  try {
    res = await fetch(query)
  } catch(e){
    console.log('error in open sea call')
  }
  let assetData = {}
  if (res){
    assetData = await res.json()
  }
  // for every token in the list, get user's balance
  let assetSymbol;
  let assetAddres;
  for (let key in assetData.assets) {
    assetSymbol = assetData.assets[key].asset_contract.symbol;
    assetAddres = assetData.assets[key].asset_contract.address;
    if (ERC721s[network].hasOwnProperty(assetSymbol)) {
      balanceData[assetAddres].push(parseInt(assetData.assets[key].token_id));
    }
  }
  //for testing purposes
  balanceData['0x7bcD4667086d271070Ae32D92782D1e692a239EA'.toLowerCase()] = [21002]
  return balanceData
}

export function addr2Bal(orderedReqs, submittedKey) {
  let ans = []
  for (let req=0;req<orderedReqs.length;req++) {
    ans.push(submittedKey[orderedReqs[req]]);
  }
  return ans
  // return orderedReqs.map((val) => submittedKey[val])
}

export function getName(address, network){
  let name = address.slice(0,8) + '...'
  for(let nft in ERC721s[network]){
    let k1 = ERC721s[network][nft].address
    let k2 = address.toLowerCase()
    if(k1 === k2){
      name = ERC721s[network][nft].name
    }
  }
  for(let token in ERC20s[network]){
    let k1 = ERC20s[network][token].address
    let k2 = address.toLowerCase()
    if(k1 === k2){
      name = ERC20s[network][token].name
    }
  }
  return name;
}


export async function getQuests(web3, network, account){
  let contract = await getContract(web3, CONTRACT[network].abi, CONTRACT[network].address)
  let questId = await contract.methods.getId().call({from : account})
  let allQuests = []
  for (let i =1; i <= questId; i++){
    let quest = await contract.methods.QUESTS(i).call({from : account})
    let reqs = []
    let length = await contract.methods.getQuestsReqLength(i).call({from : account})
    for (let j = 0; j < length; j++){
      let req = await contract.methods.getReqAddress(i, j).call({from : account})
      reqs.push(req)
    }
    let open = await contract.methods.questExists(i).call();
    if(open){
      let newQuest = {
        reqs : reqs,
        prizeAddress : quest.prizeTokenAddress,
        prizeName : getName(quest.prizeTokenAddress, network),
        prizeAmt : quest.prizeTokenAmount,
        prizeTokenId : quest.prizeTokenId,
        id : i
      }
      allQuests.push(newQuest)
   }
  }
  return allQuests
}

function handleErr(err, message) {
  if (err) {console.log('ERROR ' + message)} else {console.log('SUCCESS ' + message)}
}

export async function createQuest(
  web3,
  network,
  account,
  prizeTokenAddress,
  prizeTokenId,
  prizeTokenAmount,
  prizeIsNFT,
  requirementsList) {
    let ourContract = await getContract(web3, CONTRACT[network].abi,CONTRACT[network].address)
    await ourContract.methods.createQuest(
    prizeTokenAddress.toString(),
    prizeTokenId,
    prizeTokenAmount,
    prizeIsNFT,
    requirementsList
   ).send({from : account})
}

export async function cancelQuest(account, ourContract, questId) {
  ourContract.methods.cancelQuest(questId).send({
    from : account
   }, function(err, res){
    handleErr(err, 'in cancelling the quest!')
  });
}

export async function transferEscrow(web3, network, account, tokenId){
  let instance =  await new web3.eth.Contract(fakeNFT[network].abi, fakeNFT[network].address);
  await instance.methods.approve(CONTRACT[network].address, tokenId).send({from : account})
}

export async function completeQuest(web3, network, account, questId, submittedTokenIds) {
  let ourContract = await getContract(web3, CONTRACT[network].abi, CONTRACT[network].address)
  console.log(ourContract)
  console.log(account)
  await ourContract.methods.completeQuest(questId, submittedTokenIds).send({
    from : account
   }, function(err, res){
     handleErr(err, 'in completing the quest!')
  });
}

export async function checkSubmission(web3, reqAddress, bals){
  if(bals.hasOwnProperty(reqAddress.toLowerCase())){
    let balance = bals[reqAddress.toLowerCase()]
    if (balance.length === 0){
      return false
    }
    for (let token in bals[reqAddress.toLowerCase()]){
      let nft = bals[reqAddress.toLowerCase()][token]
      try {
        //now check if we are approved
        let reqContract = await getContract(web3, fakeNFT['Rinkeby'].abi, reqAddress)
        let approved = await reqContract.methods.getApproved(nft).call()
        if (approved === CONTRACT['Rinkeby'].address){
          return nft
        }
      } catch(err) {
        handleErr(err, 'in checking the approval status of the quest!')
      }
    }
  }
  return false
}

