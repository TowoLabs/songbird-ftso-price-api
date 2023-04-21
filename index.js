const Web3 = require("web3");
const ftsoAbi = require('./ftsoAbi.json');
const multicallAbi = require('./multicallAbi.json');

const node = "https://songbird-api.flare.network/ext/C/rpc";
const service = new Web3(node);

const allFtsos = [
  { address: "0x2be2a30c312f02b4a43327e36acc9a2e8fa94f81", symbol: "XRP/USD", decimals: 5 },
  { address: "0x1578a0e968e4bde8b0a5c0e155ac3d73adde7d9e", symbol: "LTC/USD", decimals: 5 },
  { address: "0x95f1de36a886492b2b2ce8f4476cef25d4d752ee", symbol: "XLM/USD", decimals: 5 },
  { address: "0x2f976fe9c802deaf684ad725c46f55b5c8eba19f", symbol: "DOGE/USD", decimals: 5 },
  { address: "0x9f867b6ae76fa031130d640cc58d04aa501414c0", symbol: "ADA/USD", decimals: 5 },
  { address: "0x502dd637b79b21b709fdf5b61a4b824d584224c3", symbol: "ALGO/USD", decimals: 5 },
  { address: "0xd1d12609851170e7c48e5d5022bf973cd285fbdf", symbol: "BCH/USD", decimals: 5 },
  { address: "0x72fd7a3a012370bee1f64bf55ab168524e69c24c", symbol: "DGB/USD", decimals: 5 },
  { address: "0x602b1c4c6a7f192d9c9cff7dcb3ec272ca3dfc81", symbol: "BTC/USD", decimals: 5 },
  { address: "0xd20975f531e8aea8a94f8acd8f4a67914b099471", symbol: "ETH/USD", decimals: 5 },
  { address: "0x44a26395fc561701875a653183da340f16eefdec", symbol: "FIL/USD", decimals: 5 },
  { address: "0xf9660c1421a095fe2c49e8e4396e9eaf39d3d7f3", symbol: "SGB/USD", decimals: 5 },
];

const multicallAddress = "0x17032Ea9c3a13Ed337665145364c0d2aD1108c91";
const multicallContract = new service.eth.Contract(multicallAbi, multicallAddress);

const priceCalls = [];
const getCurrentPriceMethodSignature = "0xeb91d37e";
allFtsos.forEach(ftso => {
  // const ftsoContract = new service.eth.Contract(ftsoAbi, ftso.address);
  // const ftsoCall = ftsoContract.methods.getCurrentPrice().encodeABI(); 
  // Results in 0xeb91d37e;
  priceCalls.push([ftso.address, getCurrentPriceMethodSignature]);
});

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.fetchPrices = (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://bifrostoracle.com');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');

  } else {
    const determinedPrices = [];
    multicallContract.methods.aggregate(priceCalls).call((error, result) => {

      if (error) {
        res.status(500).send();
      }

      allFtsos.forEach((ftso, index) => {
        const hexPrice = result.returnData[index].slice(0, 66);
        const price = parseInt(hexPrice, 16)/(10**ftso.decimals);
        determinedPrices.push({ price: price.toString(), symbol: ftso.symbol });
      });
      
      res.status(200).send(determinedPrices);
    });
  }
};
