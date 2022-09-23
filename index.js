const BigNumber = require("bignumber.js");
const Web3 = require("web3");
const ftsoAbi = require('./ftsoAbi.json');
const multicallAbi = require('./multicallAbi.json');

const node = "https://songbird-api.flare.network/ext/C/rpc";
const service = new Web3(node);

const allFtsos = [
    { address: "0xa1a9b8ab5bb798eee536a23669ad744dcf8537a3", symbol: "XRP/USD", decimals: 5 },
    { address: "0x157d6316475765f13348dfa897c503af0161b232", symbol: "LTC/USD", decimals: 5 },
    { address: "0xdc2cfeee7da8be3eef13b9e05bb4235063d0ecc1", symbol: "XLM/USD", decimals: 5 },
    { address: "0xbc696a456e351c8a5f170135868a3850eb29135a", symbol: "DOGE/USD", decimals: 5 },
    { address: "0xce7472a48754a2afe34951c6f35f7bfe01bb8fee", symbol: "ADA/USD", decimals: 5 },
    { address: "0x2ce1d8653bbca3f636a63e35136f4e015f0b4647", symbol: "ALGO/USD", decimals: 5 },
    { address: "0x9dcda46cb0589ec54384801905b2f79b65e93347", symbol: "BCH/USD", decimals: 5 },
    { address: "0xd47b92e53941b7f71aca3cd6235c866c55b4f23a", symbol: "DGB/USD", decimals: 5 },
    { address: "0x20fecb7b1ff69c62bba5bb6acd5a9743d11e246f", symbol: "BTC/USD", decimals: 5 },
    { address: "0x3c028fe13a87229d5d56a5b234edc0199794684e", symbol: "ETH/USD", decimals: 5 },
    { address: "0x71c57de677222f5e9bb3a3134eb27aee8b50bd39", symbol: "FIL/USD", decimals: 5 },
    { address: "0x23f1aaa1b6a5fd5bbb5906fa389d517c870ca2ff", symbol: "SGB/USD", decimals: 5 },
];

const multicallAddress = "0x17032Ea9c3a13Ed337665145364c0d2aD1108c91";
const multicallContract = new service.eth.Contract(multicallAbi, multicallAddress);

const priceCalls = [];
allFtsos.forEach(ftso => {
    const ftsoContract = new service.eth.Contract(ftsoAbi, ftso.address);
    const ftsoCall = ftsoContract.methods.getCurrentPrice().encodeABI();
    priceCalls.push([ftso.address, ftsoCall]);
});

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.fetchPrices = (req, res) => {
    const determinedPrices = [];

    multicallContract.methods.aggregate(priceCalls).call((error, result) => {
        if (error) {
            res.status(500).send();
        }
    
        allFtsos.forEach((ftso, index) => {
            const hexPrice = result.returnData[index].slice(0, 66);
            const rawPrice = new BigNumber(hexPrice);
            const price = rawPrice.shiftedBy(-ftso.decimals).toFixed();
            determinedPrices.push({ price: price, symbol: ftso.symbol });
        });
    
        res.status(200).send(determinedPrices);
    });
};
