# slash-pay-demo

SlashPay

The state of Bitcoin payment & invoicing protocols

As Bitcoin evolves with new transaction types, features, and layers, there is increasing debate about how to specify the payment process.

On the base layer we have the original Bitcoin address format, starting with “1…”, along with multi-sig addresses starting with “3…”, which also supports Segwit, and then we added native segwit “bc1q…” addresses, and now we have taproot addresses starting with “bc1p…” Each address type represents a new rule set of features that people can utilize, but none of the efforts to establish an invoicing or payment protocol for the base layer have reached popularity or notable adoption, despite some false starts, like BIP70, all we have achieved so far is BIP21 adoption for QR code compatibility.

Then came the Lightning Network, which introduced a practical method for fast, high-frequency P2P Bitcoin transactions. Lightning Network protocol includes and requires a discrete and deterministic invoicing protocol for establishing payments within a channel and across multiple routing peers on the network.

Lightning Network invoices allowed Bitcoiners to finally experience the advantages of payments that could include exact required payment amounts and metadata. This greatly enhanced the user experience and services for merchants and consumers using Bitcoin to transact.

This leaves us with two different paradigms: A base layer that can enforce its protocol, but not its payment process – and a scaling layer that can enforce its payment process, but not its protocol.

The Lightning payment process has begun to fragment and cause tension within the greater Bitcoin community as multiple implementations begin to support and propose new Lightning payment methods and types. We have BOLT12, or “Offers”, a proposed method by Rusty Russell at Blockstream. We have LNURL, another method born organically within the Lightning hacker community. We have AMP from Lightning Labs, and we will surely have more LN transaction & channel types to negotiate as PTLCs come to usage, and token formats like OmniBOLT begin to hit the wild.

Recently, these issues have caused arguments about Lightning’s equivalent of Bitcoin’s BIP spec process, the BOLT and BLiP efforts to cooperate over specs across LN implementations. Since specs and protocol are not enforceable in the same way on Lightning as on Bitcoin’s base layer, we are seeing a phenomenon of implementations leading specs independently.

However, we believe that there is a better way to abstract these problems into a design that removes the need to debate or agree on which method to choose, and allow them all to compete freely. This competition would benefit users by adding maximal interoperability within minimal risk.

Enter SlashPay.

SlashPay is a method for using Slashtags & Hypercore to abstract ALL Bitcoin payment negotiation processes, features, options, communication, and server endpoints to occur outside of the nodes and without limiting a payment to any single format.

Slashtags users communicate and authenticate using off-chain keypairs used as dynamic addresses that ultimately point to a public document using the DID specification and Hypercore’s Hyperswarm/DHT. This is a totally self-sovereign process for counterparties to specify which payment methods they support, their preferred payment methods, as well as any appropriate metadata related to the payment orders, including payment amounts, metadata.

Each payment is abstracted into a unique order ID, and payees can monitor for a successful payment across multiple payment methods before acknowledgment of receipt before delivering goods or services.

Payers can specify which payment method they prefer as well as request multiple payment type options they can pay to.


For example:

Alice wants to buy an e-book from Bob.

Alice uses Bob’s Slashtag (pubkey) to look up his DID document on the Hyperswarm, learning which payment methods Bob supports.

Alice happens to be able to pay with native segwit, taproot and Lightning, but Bob only lists native segwit and Lightning.

Bob sends Alice an invoice for the desired payment amount on Lightning, as well as an address for paying that amount into a unique native segwit “bc1q…” address.

Alice pays Bob over Lightning, Bob delivers a receipt proof, allowing Alice to retrieve the e-book from Bob.


SlashPay today

Today, we are simply demonstrating the SlashPay method along with the Slashtags/Hyper DID process to establish the example described above, but only for standard Lightning payments.

This design not only allows peers to specify and negotiate payment methods, but it also allows you to anchor your location to your pubkey, and change the endpoints at will. This is essentially a self-sovereign routing method that prevents censorship and makes it easy for peers to find you no matter where you move, no matter which payment endpoints you add or remove, and no matter which name people knew you as. All they need is your Slashtag (pubkey) and access to the Hyperswarm/DHT and they can discover any updates about your endpoints, totally detaching and abstracting your identity from your IP or email or domain, regardless of whether you have been banned, relocated, or modified!


SlashPay in the future

In the future, this process will be able to specify all of the payment types within the Bitcoin world, including all of the competing methods like Offers & LNURL, etc.

This payment negotiation process is so abstracted that it could allow for new ways to coordinate Bitcoin transactions, including multisigs, DLCs, and mixes.

It could even support non-Bitcoin payments like credit cards and other payment processors. You only need to locally and mutually support the method across payer and payee.!

So, stop bickering, stop posturing, and enter the ring with SlashPay!

### Setup
 1. Install Lightning Polar and create a single lnd node: https://lightningpolar.com
 2. Clone the repo:
    - `git clone https://github.com/synonymdev/slash-pay-demo && cd slash-pay-demo && npm i`
 3. Replace "CERT", "MACAROON" & "SOCKET" in `index.js` with "TLS Cert", "Admin Macaroon", & "GRPC Host" respectively from the "Connect" view of your Lightning Polar lnd node.
 4. Open a terminal and start the server with `node .`
 