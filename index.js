const webSocket = require("ws");
const ws = new webSocket(
    `${process.env.STREAM_URL}/${process.env.SYMBOL.toLowerCase()}@ticker`
);

const PROFITABILITY = parseFloat(process.env.PROFITABILITY);
let sellPrice = 0;

ws.onmessage = (event) => {
    console.clear();
    const obj = JSON.parse(event.data);
    console.log("symbol: " + obj.s);
    console.log("best ask: " + obj.a);

    const currentPrice = parseFloat(obj.a);

    if (sellPrice === 0 && currentPrice < 75000) {
        console.log("Bom para compra");
        newOrder("0.001", "BUY");
        sellPrice = currentPrice * PROFITABILITY;
    } else if (sellPrice !== 0 && currentPrice >= sellPrice) {
        console.log("Bom para vender");
        newOrder("0.001", "SELL");
        sellPrice = 0;
    } else {
        console.log("Esperando...Sell Price: " + sellPrice);
    }
};

const axios = require("axios");
const crypto = require("crypto");

async function newOrder(quantity, side) {
    const data = {
        Symbol: process.env.SYMBOL,
        type: "MARKET",
        side,
        quantity,
    };

    const timesTamp = Date.now();
    const racvWindow = 5000;

    const signature = crypto
        .createHmac("sha256", process.env.SECRET_KEY)
        .update(`${new URLSearchParams({ ...data, timesTamp, racvWindow })}`)
        .digest("hex");

    const newData = { ...data, timesTamp, racvWindow, signature };
    const qs = `?${new URLSearchParams(newData)}`;

    try {
        const result = await axios({
            method: "POST",
            url: `${process.env.API_URL}/v3/order${qs}`,
            headers: { "X-MBX-APIKEY": process.env.API_KEY },
        });
        console.log(result.data);
    } catch (error) {
        console.log(error);
    }
}
