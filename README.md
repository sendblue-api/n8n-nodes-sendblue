# n8n-nodes-sendblue

Official Sendblue community node for n8n. Send one-to-one text messages and read recent messages, delivery status, and sending line state.

## Installation

In an n8n instance that permits community nodes, open Settings → Community Nodes and install `n8n-nodes-sendblue`. Package publication and verification status are tracked in GitHub releases; do not assume n8n Cloud availability before verification.

## Credentials

Create an API key and secret in your [Sendblue dashboard](https://app.sendblue.com/). Add both to the **Sendblue API** credential in n8n. n8n encrypts stored credentials; the node sends them only to `https://api.sendblue.co`.

## Operations

- **Get Lines**: retrieve sending line state.
- **Get Many Messages**: retrieve one page (1–100) of messages, optionally filtered by phone number and offset. The API response includes pagination metadata.
- **Get Message Status**: look up a send result using its message handle.
- **Send Message**: send exactly one text message per input item. Recipient and optional sending line use E.164 numbers.

Free shared-line plans require a sending line and a verified contact. Paid account limits and consent requirements still apply. Confirm the intended recipient and text before using Send Message with an AI agent. Delivery is asynchronous; retain the returned handle and use Get Message Status. The node never automatically retries a send after a timeout; check history before manually retrying.

## Development

Node.js 22.16 or newer. `npm ci`, `npm run lint`, `npm test`. Tests mock the HTTP boundary and never send real messages.

Publish with the GitHub Actions workflow after configuring npm trusted publishing for this repository and `publish.yml`. The workflow publishes with provenance and does not store an npm token.

[API documentation](https://docs.sendblue.com/) · [Privacy policy](https://www.sendblue.com/privacy-policy) · support@sendblue.com

MIT. Scaffold adapted from the n8n node starter.
