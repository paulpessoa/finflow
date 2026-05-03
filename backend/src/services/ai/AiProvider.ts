export interface StreamParams {
  systemPrompt: string;
  userPrompt: string;
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (error: any) => void;
}

export interface AiProvider {
  name: string;
  streamChat(params: StreamParams): Promise<void>;
}
