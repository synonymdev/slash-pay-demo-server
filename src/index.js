import { slashtagsPayServer } from 'hackday-slashpay';
import { readFileSync } from 'fs';
import * as lns from 'ln-service';
import {once} from 'events';
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
    //TODO: This is a hack until we can properly await the invoice subscription.
    const sub = lns.subscribeToInvoice({id: invoiceIdHexString, lnd});
    const [invoice] = await once(sub, 'invoice_updated');
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
    callback({ orderId: uuidv4(), error: !invoice, data: invoice.id });
};

const subscribeToAddress = async (address = '', addressType = 'bech32', callback) => {
    //TODO: This is a hack until we can properly listen for an address.
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
    callback({ orderId: uuidv4(), error: false, data: 'txid...' });
    /*return new Promise((resolve) => {
        if (addressType === 'p2wpkh') addressType = 'bech32';
        const sub = lns.subscribeToChainAddress({lnd, [`${addressType}_address`]: address});
        sub.on('confirmation', (data) => {
            callback({ orderId: uuidv4(), error: data.error, data });
        });
    });*/
}

const SUPPORTED_METHODS = ['bolt11', 'p2wpkh'];
const methodIsSupported = (method) => SUPPORTED_METHODS.includes(method);
const getSupportedMethods = (methods) => methods.filter((method) => methodIsSupported(method));

const runMethod = async (method) => {
    let data = { error: true, data: 'No supported method is available.', id: '' };
    if (!method) return data;
    switch (method) {
        case 'bolt11':
            data = await generateInvoice({ tokens: data.amount, description: data.description });
            break;
        case 'p2wpkh':
            data = await generateAddress(method);
            break;
        default:
            break;

    }
    return { method, ...data };
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
    const methodResponse = await runMethod(supportedMethods[0]);
    onInvoice(methodResponse);
    if (!methodResponse.error) {
        await runSubscribe(methodResponse.method, methodResponse.id, onReceipt);
    }
}
const runSlashtagsPayServer = async () => {
    const slashtag = await slashtagsPayServer(lnNodeResponse);
}

runSlashtagsPayServer();