import { apiClient } from './apiClient';

export const sendChatMessage = async (message) => {
  const data = await apiClient('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  if (typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('The chat service returned an empty response. Please try again.');
  }

  return { sender: 'ai', text: data.reply };
};
