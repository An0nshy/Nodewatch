/* Setup initial NPM packages */
const RPC_CLIENT = require('bitcoin-rpc-promise')
const express = require('express')
const app = express()

/* Declare local variables */
const auth = {
    user: "user",
    pass: "pass",
    host: "localhost",
    /* Default Recommended */
    port: 26211
}

let node = {
    status: "offline",
    blocks: 0,
    peers: 0,
    protocolversion: 0,
    walletversion: 0,
    insyncwithex: false
}

/* Initialize RPC connection */
const RPC = new RPC_CLIENT('http://' + auth.user + ':' + auth.pass + '@' + auth.host + ':' + auth.port)


/* Initialize express server */
app.get('/health', function(req, res) {
    res.json(node)
})

app.listen(3000)

/* Initialize get func  */
const getContent = function(url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => resolve(body.join('')));
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err))
    })
};
/* Fired repeatedly while the node is Offline or Errored, in an attempt to reconnect and verify node health */
function checkRPC() {
    RPC.call('getblockcount').then(blocks => {
        node.status = "online"
        console.log("RPC Response: " + blocks + ", Node status changed to " + node.status)
        updateRPC()
    }).catch(rpcError)
}

checkRPC()

/* Fired repeatedly, updates node information periodically, if online */
function updateRPC() {
    if (node.status === "online") {

        RPC.call('getinfo').then(infodata => {
            node.blocks = infodata.blocks
            node.peers = infodata.connections
            node.protocolversion = infodata.protocolversion
            node.walletversion = infodata.walletversion
            getContent("https://api.dogec.io/api/coin/").then(coindata => {
                node.insyncwithex = node.blocks == coindata.blocks || node.blocks - 2 == coindata.blocks || node.blocks + 1 == coindata.blocks

            })
        });

    }
}

setInterval(updateRPC, sec(10))

/* Fired when the Monitor catches an RPC error */
function rpcError() {
    node.status = "offline"
    console.error("RPC Error: Node status changed to " + node.status)
    setTimeout(checkRPC, sec(60))
}

/* Converts seconds into miliseconds */
function sec(s) {
    return s * 1000
}