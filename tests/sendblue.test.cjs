const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Sendblue } = require('../dist/nodes/Sendblue/Sendblue.node.js');
const { SendblueApi } = require('../dist/credentials/SendblueApi.credentials.js');
function context(params, response = { status: 'OK' }, failure) {
  const calls = [];
  return { calls, getInputData: () => [{ json: {} }], getNodeParameter: (name, i, fallback) => params[name] ?? fallback,
    getNode: () => ({ name: 'Sendblue', type: 'sendblue', typeVersion: 1, position: [0, 0], parameters: {} }),
    continueOnFail: () => false, helpers: { httpRequestWithAuthentication: async (auth, opts) => { calls.push({auth,opts}); if(failure) throw failure; return response; } } };
}
test('sends one message with explicit free-plan line and preserves item linkage', async () => {
 const ctx = context({operation:'send',number:'+15555550123',content:'hello',fromNumber:'+15555550124'});
 const result = await new Sendblue().execute.call(ctx);
 assert.equal(ctx.calls.length,1); assert.equal(ctx.calls[0].auth,'sendblueApi');
 assert.deepEqual(ctx.calls[0].opts.body,{number:'+15555550123',content:'hello',from_number:'+15555550124'});
 assert.equal(ctx.calls[0].opts.url,'https://api.sendblue.co/api/send-message'); assert.deepEqual(result[0][0].pairedItem,{item:0});
});
test('rejects bad recipient before network access', async () => {
 const ctx = context({operation:'send',number:'bad',content:'hello'});
 await assert.rejects(new Sendblue().execute.call(ctx)); assert.equal(ctx.calls.length,0);
});
test('a send timeout is not retried', async () => {
 const ctx = context({operation:'send',number:'+15555550123',content:'hello'},null,new Error('timeout'));
 await assert.rejects(new Sendblue().execute.call(ctx)); assert.equal(ctx.calls.length,1);
});
test('bounds history and passes filters', async () => {
 const ctx = context({operation:'getMessages',limit:20,filters:{number:'+15555550123',offset:20}},{messages:[],pagination:{total:0}});
 const out=await new Sendblue().execute.call(ctx); assert.deepEqual(ctx.calls[0].opts.qs,{limit:20,number:'+15555550123',offset:20}); assert.deepEqual(out[0][0].json.pagination,{total:0});
});
test('status uses encoded query parameters and line arrays remain JSON objects', async () => {
 const ctx = context({operation:'getStatus',handle:'a&b'}); await new Sendblue().execute.call(ctx); assert.deepEqual(ctx.calls[0].opts.qs,{handle:'a&b'});
 const lines=context({operation:'getLines'},[]); const out=await new Sendblue().execute.call(lines); assert.deepEqual(out[0][0].json,{data:[]});
});
test('credentials use only Sendblue API headers',()=> {
 const headers=new SendblueApi().authenticate.properties.headers;
 assert.deepEqual(Object.keys(headers),['sb-api-key-id','sb-api-secret-key']);
});
