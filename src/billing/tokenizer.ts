import { ChatCompletionResponse, ErrorResponse } from '../providers/types';
import { ContentType } from '../types/requestBody';
import { encode } from 'gpt-tokenizer';

interface GetUsedTokensI {
  (response: ChatCompletionResponse | ErrorResponse): number;
}

export function calculateTokens(message: string): number {
  let tokens = encode(message);
  console.log(`Decoded message: [${message}] with tokens: ${tokens}`);
  return tokens.length;
}

export const getUsedTokens: GetUsedTokensI =
  function(response: ChatCompletionResponse | ErrorResponse): number {

    if ('error' in response) {
      console.log('Got error response in \'getUsedTokens\' function');
      return 0;
    }

    if ('usage' in response) {
      let prompt_tokens = response.usage.prompt_tokens || {};
      let completion_tokens = response.usage.completion_tokens || {};
      if (prompt_tokens && completion_tokens) {
        console.log(`Got ${prompt_tokens + completion_tokens} in response body with id: ${response.id}`);
        return prompt_tokens + completion_tokens;
      }
    }

    const { choices } = response;

    let total_tokens: number = 0;

    console.log(`Starting counting tokens in choices of response with id: ${response.id}`);

    for (const [_, choice] of choices.entries()) {
      if (choice.message && choice.message.content) {
        let message = choice.message;

        if (typeof message.content == 'string') {
          console.log(`Counting tokens of response id: ${response.id} in choice index: ${choice.index} with 'string' type`);
          total_tokens += calculateTokens(message.content);
        }

        if (typeof message.content === 'object') {
          message.content.forEach((c: ContentType) => {
            if (c.type === 'text' && c.text) {
              console.log(`Counting tokens of response id: ${response.id} in choice index: ${choice.index} with 'Content Type'`);
              total_tokens += calculateTokens(c.text);
            }
          });
        }

      }
    }

    return total_tokens;
  };
