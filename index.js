import { Account, Contract, RpcProvider, CallData, hash, ec, num, uint256, constants } from 'starknet'
import { getAddressFromPrivateArgent, getAddressFromPrivateBravos } from './utils.js'
import ERC20_ABI from './abis/StarknetErc20Abi.json' assert {type: "json"};
import chalk from 'chalk';
import fs from 'fs'
import * as dotenv from "dotenv";
dotenv.config();



const batchCollectEth = async (acc, recip, provider) => {
    const { address, priv } = acc;
    console.log(chalk.green("Transfer eth"))
    console.log(chalk.green("Wallet addrress: ", address))

    const signer = new Account(provider, address, priv, '1', undefined, constants.TRANSACTION_VERSION.V2);
    const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    const tokenContract = new Contract(ERC20_ABI, ethAddress, signer);
    const balanceResp = await tokenContract.balanceOf(signer.address);
    const balance = balanceResp - 100000000000000n;
    console.log(chalk.green(balance));
    if (balance <= 0) {
        console.log(chalk.red("low balance for wallet"))
        return
    }

    const transferCallData = tokenContract.populate("transfer", {
        recipient: recip,
        amount: uint256.bnToUint256(balance) // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    });

    const transfer = await signer.execute(transferCallData)
    console.log(transfer);
}


const batchCollectStk = async (acc, recip, provider) => {
    const { address, priv } = acc;

    const signer = new Account(provider, address, priv, '1', undefined, constants.TRANSACTION_VERSION.V2);
    const ethAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
    const tokenContract = new Contract(ERC20_ABI, ethAddress, signer);
    const balanceResp = await tokenContract.balanceOf(signer.address);
    const balance = balanceResp;
    console.log(chalk.green(balance));
    if (balance <= 0) {
        console.log(chalk.red("low balance for wallet"))
        return
    }

    const transferCallData = tokenContract.populate("transfer", {
        recipient: recip,
        amount: uint256.bnToUint256(balance) // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    });

    const transfer = await signer.execute(transferCallData)
    console.log(transfer);
}


const batchCollectToken = async (acc, recip, provider) => {
    const { address, priv } = acc;
    const tokenAddress = process.env.TOKEN_ADDRESS;

    if (!tokenAddress) {
        console.log(chalk.red("Token not found"))
        return;
    }
    const signer = new Account(provider, address, priv, '1', undefined, constants.TRANSACTION_VERSION.V2);
    const ethAddress = tokenAddress;
    const tokenContract = new Contract(ERC20_ABI, ethAddress, signer);
    const balanceResp = await tokenContract.balanceOf(signer.address);
    const balance = balanceResp;
    console.log(chalk.green(balance));
    if (balance <= 0) {
        console.log(chalk.red("low balance for wallet"))
        return
    }
    const transferCallData = tokenContract.populate("transfer", {
        recipient: recip,
        amount: uint256.bnToUint256(balance) // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    });

    const transfer = await signer.execute(transferCallData)
    console.log(transfer);
}


const proccedBatch = async (type, acc, recip) => {
    const rpcUrl = process.env.RPC;
    const provider = new RpcProvider({
        nodeUrl: rpcUrl
    });

    const timeout = parseInt(process.env.TIMEOUT);
    switch (type) {
        case "eth": await batchCollectEth(acc, recip, provider); break;
        case "strk": await batchCollectStk(acc, recip, provider); break;
        case "token": await batchCollectToken(acc, recip, provider); break;
        default: console.log(chalk.red("Not found")); break;
    }
    await new Promise(resolve => setTimeout(resolve, timeout));
}


const singlDstMode = async (type, parsedWallets, dstAddress) => {
    console.log(chalk.green("single dst"))
    for (let i = 0; i < parsedWallets.length; i++) {
        await proccedBatch(type, parsedWallets[i], dstAddress);
    }
}


const multiDstMode = async (type, parsedWallets, dstAddresses) => {
    console.log(chalk.green("Multipl dst"))
    for (let i = 0; i < parsedWallets.length; i++) {
        await proccedBatch(type, parsedWallets[i], dstAddresses[i]);
    }
}



const main = async () => {
    const walletsFile = fs.readFileSync('./wallets.txt').toString()
    const walletsArray = walletsFile.split('\n').map(w => w.trim());
    const dstFile = fs.readFileSync('./destination.txt').toString()
    const destinationArray = dstFile.split('\n').map(w => w.trim());
    const walletType = process.env.WALLET_TYPE;
    const module = process.env.MODULE;


    if (destinationArray[0] == "" || walletsArray[0] == "") {
        console.log(chalk.red("Wallets or destination addresses not found"))
        return
    }
    const accounts = [];
    walletsArray.forEach(pk => {
        let address;
        if (walletType == 'argent') {
            console.log('argent')
            address = getAddressFromPrivateArgent(pk)
        }
        else {
            address = getAddressFromPrivateBravos(pk)
        }

        if (address) {
            accounts.push({ address: address, priv: pk })
        }
    });

    console.log(accounts)


    if (destinationArray.length > 1) {
        if (destinationArray.length != walletsArray.length) {
            console.log(chalk.red("Not enought destination addresses"))
            return
        }

        await multiDstMode(module, accounts, destinationArray);
    }
    else {
        await singlDstMode(module, accounts, destinationArray[0]);
    }


}


main()

