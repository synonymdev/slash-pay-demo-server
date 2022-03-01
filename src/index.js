import { slashtagsPayServer } from 'hackday-slashpay';
import { readFileSync } from 'fs';
import * as lns from 'ln-service';
import { v4 as uuidv4 } from 'uuid';

const CERT = '/Users/user/.polar/networks/1/volumes/lnd/alice/tls.cert';
const MACAROON = '/Users/user/.polar/networks/1/volumes/lnd/alice/data/chain/bitcoin/regtest/admin.macaroon';
const SOCKET = '127.0.0.1:10001';

const toB64 = (path) => readFileSync(path, { encoding: 'base64' });
const { lnd } = lns.authenticatedLndGrpc({
    cert: toB64(CERT),
    macaroon: toB64(MACAROON),
    socket: SOCKET
});

/**
 * Generates a bolt11 invoice from the lightning node.
 * @param {number} tokens
 * @param {string} description
 * @returns {Promise<{ error: boolean, data: string, id: string }>}
 */
const generateInvoice = async ({ tokens, description }) => {
    const invoice = await lns.createInvoice({lnd, tokens, description});
    const error = !invoice?.request;
    const data = invoice?.request ?? 'Unable to retrieve an invoice at this time.';
    const id = error ? '' : invoice?.id;
    return {error, data, id };
}

/**
 * Returns a new address from the lightning node.
 * @param {'p2wpkh' | 'p2sh' | 'p2pkh'} format
 * @returns {Promise<{ error: boolean, data: string, id: string }>}
 */
const generateAddress = async (format = 'p2wpkh') => {
    const {address} = await lns.createChainAddress({format, lnd});
    const error = !address;
    const data = !address ? 'Unable to retrieve an address at this time.' : address;
    return {error, data, id: data};
}

const subscribeToInvoice = async (invoiceIdHexString, callback) => {
    const sub = lns.subscribeToInvoice({id: invoiceIdHexString, lnd});
    sub.on('invoice_updated', (data) => {
        //TODO: Ensure the proper amount has been received.
        if (data?.received > 0) {
            callback({ orderId: uuidv4(), error: !data, data: data?.id });
            sub.abort();
        }
    });
};

const subscribeToAddress = async (address = '', addressType = 'bech32', callback) => {
    if (addressType === 'p2wpkh') addressType = 'bech32';
    const sub = lns.subscribeToChainAddress({
        lnd,
        [`${addressType}_address`]: address,
        min_height: 1,
        min_confirmations: 0
    });
    sub.on('confirmation', (data) => {
        callback({ orderId: uuidv4(), error: !data, data: data?.transaction });
        sub.abort();
    });
}

const SUPPORTED_METHODS = ['bolt11', 'p2wpkh', 'p2sh', 'p2pkh' ];
const methodIsSupported = (method) => SUPPORTED_METHODS.includes(method);
const getSupportedMethods = (methods) => methods.filter((method) => methodIsSupported(method));

const runMethod = async (method, data) => {
    let response = { error: true, data: 'No supported method is available.', id: '' };
    if (!method) return response;
    switch (method) {
        case 'bolt11':
            response = await generateInvoice({ tokens: Number(data.amount), description: data.description });
            break;
        case 'p2wpkh':
        case 'p2sh':
        case 'p2pkh':
            response = await generateAddress(method);
            break;
        default:
            break;

    }
    console.log('\n');
    console.log('Receipt Response:', { method, ...response });
    console.log('\n');
    return { method, ...response };
}

const runSubscribe = async (method, id, callback) => {
    let data = { error: true, data: 'No supported method is available.' };
    if (!method) return data;
    switch (method) {
        case 'bolt11':
            data = await subscribeToInvoice(id, callback);
            break;
        case 'p2wpkh':
            data = await subscribeToAddress(id, method, callback);
            break;
        default:
            break;
    }
}

const lnNodeResponse = async (data, onInvoice, onReceipt) => {
    // Grab an array of supported methods, if any.
    const supportedMethods = getSupportedMethods(data.methods);
    // Attempt to run the first supported method. Returns error if undefined.
    const methodResponse = await runMethod(supportedMethods[0], data);
    onInvoice(methodResponse);
    if (!methodResponse.error) {
        await runSubscribe(methodResponse.method, methodResponse.id, onReceipt);
    }
}
const runSlashtagsPayServer = async () => {
    const slashtag = await slashtagsPayServer(lnNodeResponse);
}

runSlashtagsPayServer();