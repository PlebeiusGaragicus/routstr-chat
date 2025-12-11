import { Message, MessageAttachment, MessageContent } from "@/types/chat";

/**
 * Extracts text content from a message that can be either string or multimodal content
 * @param content The message content (string or MessageContent array)
 * @returns The text content as a string
 */
export const getTextFromContent = (
  content: string | MessageContent[]
): string => {
  if (typeof content === "string") return content;
  const textContent = content.find(
    (item) => item.type === "text" && !item.hidden
  );
  return textContent?.text || "";
};

/**
 * Converts a Message object to the format expected by the API
 * @param message The message to convert
 * @returns Object with role and content for API consumption
 */
export const convertMessageForAPI = (
  message: Message
): { role: string; content: string | MessageContent[] } => {
  return {
    role: message.role,
    content: message.content,
  };
};

/**
 * Creates a simple text message
 * @param role The message role (user, assistant, system)
 * @param text The text content
 * @returns A Message object with text content
 */
export const createTextMessage = (role: string, text: string, prevId?: string): Message => {
  return {
    role,
    content: text,
  };
};

/**
 * Creates a multimodal message with text and attachments
 * @param role The message role (user, assistant, system)
 * @param text The text content
 * @param attachments Array of attachments (images, files, etc.)
 * @returns A Message object with multimodal content
 */
export const createMultimodalMessage = (
  role: string,
  text: string,
  attachments: MessageAttachment[]
): Message => {
  const content: MessageContent[] = [];

  if (text.trim().length > 0) {
    content.push({ type: "text", text });
  }

  attachments.forEach((attachment) => {
    if (attachment.type === "image") {
      content.push({
        type: "image_url",
        image_url: {
          url: attachment.dataUrl,
          storageId: attachment.storageId,
        },
      });
    } else {
      content.push({
        type: "file",
        file: {
          url: attachment.dataUrl,
          name: attachment.name,
          mimeType: attachment.mimeType,
          size: attachment.size,
          storageId: attachment.storageId,
        },
      });

      if (attachment.textContent && attachment.textContent.trim().length > 0) {
        const header = `PDF attachment (${attachment.name}):`;
        content.push({
          type: "text",
          text: `${header}\n\n${attachment.textContent}`,
          hidden: true,
        });
      }
    }
  });

  if (content.length === 0) {
    // Fallback to an empty string message to avoid invalid payloads
    return {
      role,
      content: "",
    };
  }

  return {
    role,
    content,
  };
};

/**
 * Strips image and file data from a single message for storage optimization.
 * Removes base64 data URLs while preserving storageIds for later retrieval.
 * If no storageId exists, replaces media content with placeholder text.
 * @param msg The message to process
 * @returns Message with image/file data removed but structure preserved
 */
export const stripImageDataFromSingleMessage = (msg: Message): Message => {
  if (Array.isArray(msg.content)) {
    // Check if we have storageIds for all media
    const mediaItems = msg.content.filter(
      (item) => item.type === "image_url" || item.type === "file"
    );
    const allHaveStorage = mediaItems.every(
      (item) =>
        (item.type === "image_url" && item.image_url?.storageId) ||
        (item.type === "file" && item.file?.storageId)
    );

    if (allHaveStorage) {
      // If we have storage IDs, we can safely remove the base64 dataUrl to save space
      // but keep the message structure with storageId
      return {
        ...msg,
        content: msg.content.map((item) => {
          if (item.type === "image_url" && item.image_url?.storageId) {
            return {
              ...item,
              image_url: {
                ...item.image_url,
                url: "", // Clear base64, keep storageId
              },
            };
          }
          if (item.type === "file" && item.file?.storageId) {
            return {
              ...item,
              file: {
                ...item.file,
                url: "", // Clear base64, keep storageId
              },
            };
          }
          return item;
        }),
      };
    }

    const textContent = msg.content.filter(
      (item) => item.type === "text" && !item.hidden
    );
    if (textContent.length === 0) {
      const hasMedia = msg.content.some(
        (item) => item.type === "image_url" || item.type === "file"
      );
      if (hasMedia) {
        return {
          ...msg,
          content: "[Attachment(s) not saved to local storage]",
        };
      }
      return { ...msg, content: "[Content removed]" };
    }
    return { ...msg, content: textContent };
  }
  return msg;
};

/**
 * Strips image and file data from messages for storage optimization.
 * Removes base64 data URLs while preserving storageIds for later retrieval.
 * If no storageId exists, replaces media content with placeholder text.
 * @param messages Array of messages to process
 * @returns Array of messages with image/file data removed but structure preserved
 */
export const stripImageDataFromMessages = (messages: Message[]): Message[] => {
  return messages.map(stripImageDataFromSingleMessage);
};

/**
 * Extracts thinking tags from streaming AI response chunks.
 * Handles both <thinking> and <thinking> tag formats.
 * @param chunk The current chunk of streaming content
 * @param accumulatedThinking Previously accumulated thinking content
 * @returns Object containing separated thinking and content, plus thinking state
 */
export const extractThinkingFromStream = (
  chunk: string,
  accumulatedThinking: string = ""
): {
  thinking: string;
  content: string;
  isInThinking: boolean;
} => {
  const thinkingStart = /<(?:antml:)?thinking>/;
  const thinkingEnd = /<\/(?:antml:)?thinking>/;

  let thinking = accumulatedThinking;
  let content = "";
  let isInThinking =
    accumulatedThinking.length > 0 &&
    !accumulatedThinking.includes("</thinking>");

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
