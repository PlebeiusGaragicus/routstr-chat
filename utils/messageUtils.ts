import { Message, MessageContent } from '@/types/chat';

/**
 * Extracts text content from a message that can be either string or multimodal content
 * @param content The message content (string or MessageContent array)
 * @returns The text content as a string
 */
export const getTextFromContent = (content: string | MessageContent[]): string => {
  if (typeof content === 'string') return content;
  const textContent = content.find(item => item.type === 'text');
  return textContent?.text || '';
};

/**
 * Converts a Message object to the format expected by the API
 * @param message The message to convert
 * @returns Object with role and content for API consumption
 */
export const convertMessageForAPI = (message: Message): { role: string; content: string | MessageContent[] } => {
  return {
    role: message.role,
    content: message.content
  };
};

/**
 * Creates a simple text message
 * @param role The message role (user, assistant, system)
 * @param text The text content
 * @returns A Message object with text content
 */
export const createTextMessage = (role: string, text: string): Message => {
  return {
    role,
    content: text
  };
};

/**
 * Creates a multimodal message with text and images
 * @param role The message role (user, assistant, system)
 * @param text The text content
 * @param images Array of image URLs
 * @returns A Message object with multimodal content
 */
export const createMultimodalMessage = (role: string, text: string, images: string[]): Message => {
  const content: MessageContent[] = [
    { type: 'text', text }
  ];

  images.forEach(imageUrl => {
    content.push({
      type: 'image_url',
      image_url: { url: imageUrl }
    });
  });

  return {
    role,
    content
  };
};

/**
 * Strips image data from messages for storage optimization
 * @param messages Array of messages to process
 * @returns Array of messages with image data removed
 */
export const stripImageDataFromMessages = (messages: Message[]): Message[] => {
  return messages.map(msg => {
    if (Array.isArray(msg.content)) {
      const textContent = msg.content.filter(item => item.type === 'text');
      if (textContent.length === 0 && msg.content.some(item => item.type === 'image_url')) {
        // If only images were present, save a placeholder
        return { ...msg, content: '[Image(s) not saved to local storage]' };
      }
      return { ...msg, content: textContent.length > 0 ? textContent : '[Content removed]' };
    }
    return msg;
  });
};

export const extractThinkingFromStream = (chunk: string, accumulatedThinking: string = ''): {
  thinking: string;
  content: string;
  isInThinking: boolean;
} => {
  const thinkingStart = /<(?:antml:)?thinking>/;
  const thinkingEnd = /<\/(?:antml:)?thinking>/;
  
  let thinking = accumulatedThinking;
  let content = '';
  let isInThinking = accumulatedThinking.length > 0 && !accumulatedThinking.includes('</thinking>');
  
  if (isInThinking) {
    const endMatch = chunk.match(thinkingEnd);
    if (endMatch) {
      const endIndex = chunk.indexOf(endMatch[0]);
      thinking += chunk.slice(0, endIndex);
      content = chunk.slice(endIndex + endMatch[0].length);
      isInThinking = false;
    } else {
      thinking += chunk;
    }
  } else {
    const startMatch = chunk.match(thinkingStart);
    if (startMatch) {
      const startIndex = chunk.indexOf(startMatch[0]);
      content = chunk.slice(0, startIndex);
      
      const remainingChunk = chunk.slice(startIndex + startMatch[0].length);
      const endMatch = remainingChunk.match(thinkingEnd);
      
      if (endMatch) {
        const endIndex = remainingChunk.indexOf(endMatch[0]);
        thinking = remainingChunk.slice(0, endIndex);
        content += remainingChunk.slice(endIndex + endMatch[0].length);
        isInThinking = false;
      } else {
        thinking = remainingChunk;
        isInThinking = true;
      }
    } else {
      content = chunk;
    }
  }
  
  return { thinking, content, isInThinking };
};
