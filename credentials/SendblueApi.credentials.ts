import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class SendblueApi implements ICredentialType {
  name = 'sendblueApi';
  displayName = 'Sendblue API';
  icon: Icon = 'file:../nodes/Sendblue/sendblue.svg';
  documentationUrl = 'https://docs.sendblue.com/';
  properties: INodeProperties[] = [
    { displayName: 'API Key', name: 'apiKey', type: 'string', typeOptions: { password: true }, required: true, default: '' },
    { displayName: 'API Secret', name: 'apiSecret', type: 'string', typeOptions: { password: true }, required: true, default: '' },
  ];
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: { headers: { 'sb-api-key-id': '={{$credentials.apiKey}}', 'sb-api-secret-key': '={{$credentials.apiSecret}}' } },
  };
  test: ICredentialTestRequest = { request: { baseURL: 'https://api.sendblue.co', url: '/api/v2/lines/state', method: 'GET' } };
}
