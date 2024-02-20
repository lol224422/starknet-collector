import { CallData, hash, ec, num } from 'starknet'
import chalk from 'chalk';


export const getAddressFromPrivateArgent = (privateKey) => {
    try {
        //const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
        const argentXaccountClassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
        //  const argentXaccountClassHash = "0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
        const pk = ec.starkCurve.getStarkKey(privateKey);
        const AXproxyConstructorCallData = CallData.compile({ owner: pk, guardian: "0" });
        const AXcontractAddress = hash.calculateContractAddressFromHash(
            pk,
            argentXaccountClassHash,
            AXproxyConstructorCallData,
            0
        );
        return AXcontractAddress
    }
    catch (error) {
        console.log(chalk.redBright("Failed to parse Argent X private key!"));
    }

}


const BraavosInitialClassHash = '0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570';
const calcBraavosInit = (starkKeyPubBraavos) =>
    CallData.compile({ public_key: starkKeyPubBraavos });
const BraavosProxyConstructor = (BraavosInitializer) =>
    CallData.compile({
        implementation_address: BraavosInitialClassHash,
        initializer_selector: hash.getSelectorFromName('initializer'),
        calldata: [...BraavosInitializer],
    });



export const getAddressFromPrivateBravos = (privateKeyBraavos) => {
    try {
        const BraavosProxyClassHash = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e"
        const starkKeyPubBraavos = ec.starkCurve.getStarkKey(privateKeyBraavos);
        const BraavosInitializer = calcBraavosInit(starkKeyPubBraavos);
        const BraavosProxyConstructorCallData = BraavosProxyConstructor(BraavosInitializer);

        return hash.calculateContractAddressFromHash(
            starkKeyPubBraavos,
            BraavosProxyClassHash,
            BraavosProxyConstructorCallData,
            0
        );
    }
    catch (error) {
        console.log(error)
        console.log(chalk.redBright("Failed to parse Bravos private key!"));
    }

}