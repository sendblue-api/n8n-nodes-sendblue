import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, IHttpRequestOptions } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError, ApplicationError } from 'n8n-workflow';

export class Sendblue implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sendblue', name: 'sendblue', icon: 'file:sendblue.svg', group: ['transform'], version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Send messages and read history, delivery status, and sending lines',
    defaults: { name: 'Sendblue' }, inputs: [NodeConnectionTypes.Main], outputs: [NodeConnectionTypes.Main], usableAsTool: true,
    credentials: [{ name: 'sendblueApi', required: true }],
    properties: [
      { displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'getMessages', options: [
        { name: 'Get Lines', value: 'getLines', description: 'Get sending line state', action: 'Get sending lines' },
        { name: 'Get Many Messages', value: 'getMessages', description: 'Get a page of recent messages', action: 'Get many messages' },
        { name: 'Get Message Status', value: 'getStatus', description: 'Get delivery status by message handle', action: 'Get message status' },
        { name: 'Send Message', value: 'send', description: 'Send one text message to a recipient', action: 'Send a message' },
      ] },
      { displayName: 'Recipient', name: 'number', type: 'string', default: '', required: true, placeholder: '+15555550123', description: 'Recipient phone number in E.164 format', displayOptions: { show: { operation: ['send'] } } },
      { displayName: 'Message', name: 'content', type: 'string', typeOptions: { rows: 4 }, default: '', required: true, description: 'Text to send to the recipient', displayOptions: { show: { operation: ['send'] } } },
      { displayName: 'Sending Line', name: 'fromNumber', type: 'string', default: '', placeholder: '+15555550123', description: 'Your Sendblue line in E.164 format. Required for free shared-line plans.', displayOptions: { show: { operation: ['send'] } } },
      { displayName: 'Message Handle', name: 'handle', type: 'string', default: '', required: true, description: 'Handle returned when the message was sent', displayOptions: { show: { operation: ['getStatus'] } } },
      { displayName: 'Limit', name: 'limit', type: 'number', default: 50, typeOptions: { minValue: 1, maxValue: 100 }, description: 'Max number of results to return', displayOptions: { show: { operation: ['getMessages'] } } },
      { displayName: 'Filters', name: 'filters', type: 'collection', placeholder: 'Add Filter', default: {}, displayOptions: { show: { operation: ['getMessages'] } }, options: [
        { displayName: 'Phone Number', name: 'number', type: 'string', default: '', description: 'Filter by any phone number in E.164 format' },
        { displayName: 'Offset', name: 'offset', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Number of messages to skip' },
      ] },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const output: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const options: IHttpRequestOptions = { method: 'GET', url: 'https://api.sendblue.co', json: true, timeout: 30000 };
        if (operation === 'send') {
          const number = this.getNodeParameter('number', i) as string;
          const content = this.getNodeParameter('content', i) as string;
          const from = this.getNodeParameter('fromNumber', i, '') as string;
          if (!/^\+[1-9]\d{7,14}$/.test(number) || (from && !/^\+[1-9]\d{7,14}$/.test(from))) throw new ApplicationError('Phone numbers must use E.164 format');
          if (!content.trim()) throw new ApplicationError('Message text is required');
          options.method = 'POST'; options.url += '/api/send-message';
          options.body = { number, content, ...(from ? { from_number: from } : {}) };
        } else if (operation === 'getStatus') {
          const handle = this.getNodeParameter('handle', i) as string;
          if (!handle.trim()) throw new ApplicationError('Message handle is required');
          options.url += '/api/status'; options.qs = { handle };
        } else if (operation === 'getMessages') {
          const limit = this.getNodeParameter('limit', i, 20) as number;
          if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ApplicationError('Limit must be between 1 and 100');
          const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
          options.url += '/api/v2/messages'; options.qs = { limit, ...(filters.number ? { number: filters.number } : {}), ...(filters.offset ? { offset: filters.offset } : {}) };
        } else if (operation === 'getLines') {
          options.url += '/api/v2/lines/state';
        } else {
          throw new ApplicationError('Unknown operation');
        }
        // Never retry sends automatically: a timeout may occur after acceptance.
        const result = await this.helpers.httpRequestWithAuthentication.call(this, 'sendblueApi', options);
        output.push({ json: (Array.isArray(result) ? { data: result } : result) as IDataObject, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) output.push({ json: { error: error.message }, pairedItem: { item: i } });
        else throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
      }
    }
    return [output];
  }
}
